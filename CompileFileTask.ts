import {ProjectOptions, Task, TaskOptions} from "pango";
import * as path from "path";
import * as fs from "fs-extra";
import {COMPONENT_NAME} from "./BuildComponent";
import {Source} from "./Source";
import {GccComponentOptions} from "./GccComponentOptions";

export class CompileFileTask extends Task {
    source: Source;

    constructor(source: Source) {
        super();
        this.name = `CC ${path.basename(source.filePath)}`;
        this.source = source;
    }

    run(taskOptions: TaskOptions): Promise<void> {
        const componentOptions: GccComponentOptions = taskOptions.projectOptions.components[COMPONENT_NAME];
        const ext = path.extname(this.source.filePath).toLowerCase();
        const compiler = componentOptions.compilers[ext];
        if (!compiler) {
            return Promise.reject(new Error(`Could not find compiler for extension ${ext}`));
        }

        return this.shouldExecute(taskOptions)
            .then(shouldExecute => {
                if (!shouldExecute) {
                    return Promise.resolve();
                }
                return fs.mkdirs(path.dirname(this.source.outputPath))
                    .then(() => {
                        const cmd = [compiler, '-c']
                            .concat(this.getCompilerOptions(componentOptions))
                            .concat(['-o', this.source.outputPath]);
                        taskOptions.log.info(cmd.join(' '));
                        return this.shell(taskOptions, cmd);
                    })
                    .then(() => {
                        const cmd = [compiler, '-MM']
                            .concat(this.getCompilerOptions(componentOptions))
                            .concat(['-o', this.source.depPath]);
                        return this.shell(taskOptions, cmd);
                    });
            })
            .then(() => {
                componentOptions.allObjectFiles.push(this.source.outputPath);
            });
    }

    private shouldExecute(taskOptions: TaskOptions): Promise<boolean> {
        return fs.pathExists(this.source.outputPath)
            .then(exists => {
                if (!exists) {
                    return true;
                }

                return Promise.all([
                    this.getInputModifiedTime(taskOptions),
                    this.getOutputModifiedTime()
                ]).then(results => {
                    return results[0] > results[1];
                });
            });
    }

    private getCompilerOptions(componentOptions: GccComponentOptions): string[] {
        let options = [];
        options = options.concat(componentOptions.compilerOptions || []);
        options = options.concat(componentOptions.allIncludeDirs.reduce((all, s) => {
            return all.concat(['-I', s])
        }, []));
        options = options.concat([this.source.filePath]);
        return options;
    }

    getPrerequisites(projectOptions: ProjectOptions): string[] {
        return ['compile'];
    }

    getPostRequisites(projectOptions: ProjectOptions): string[] {
        return ['link'];
    }

    private getInputModifiedTime(taskOptions: TaskOptions): Promise<number> {
        return this.getInputFiles()
            .then(files => {
                if (files.length === 0) {
                    return Number.MAX_SAFE_INTEGER;
                }
                return Promise.all(files.map(file => {
                    return fs.pathExists(file)
                        .then(exists => {
                            if (!exists) {
                                taskOptions.log.debug(`Could not find input file: ${file}`);
                                return null;
                            }
                            return fs.stat(file);
                        });
                })).then(results => {
                    return results
                        .map(item => item ? item.mtimeMs : Number.MAX_SAFE_INTEGER)
                        .reduce((lastResult, currentValue) => {
                            return Math.max(lastResult, currentValue);
                        }, 0);
                });
            });
    }

    private getOutputModifiedTime(): Promise<number> {
        return fs.stat(this.source.outputPath)
            .then(stat => {
                return stat.mtimeMs;
            });
    }

    private getInputFiles(): Promise<string[]> {
        return fs.pathExists(this.source.depPath)
            .then(exists => {
                if (!exists) {
                    return [];
                }
                return fs.readFile(this.source.depPath, 'utf8')
                    .then(depContents => {
                        const depLines = depContents.trim().split('\n')
                            .map(line => line.replace(/\\$/, '').trim());
                        depLines[0] = depLines[0].replace(/.*?:/, '').trim();
                        return Promise.resolve(depLines.filter(dep => {
                            return dep && dep.length > 0;
                        }));
                    });
            });
    }
}
