import {ProjectOptions, Task, TaskOptions} from "pango";
import {BuildComponent, COMPONENT_NAME} from "./BuildComponent";
import {GccComponentOptions} from "./GccComponentOptions";
import * as path from "path";
import {CompileFileTask} from "./CompileFileTask";
import {Source} from "./Source";
import * as glob from "glob-promise";
import {Tasks} from "../pango/Task";

export class CompileTask extends Task {
    run(taskOptions: TaskOptions): Promise<Tasks> {
        const includeDirs = this.getAllComponentOptions(taskOptions.projectOptions, 'includeDirs', true);
        const compilerOptions = this.getAllComponentOptions(taskOptions.projectOptions, 'compilerOptions', false);
        const linkerOptions = this.getAllComponentOptions(taskOptions.projectOptions, 'linkerOptions', false);
        const component: GccComponentOptions = taskOptions.projectOptions.components[COMPONENT_NAME];
        component.compilers = {
            ...BuildComponent.getDefaultCompilers(),
            ...(component.compilers || {})
        };
        component.allObjectFiles = component.allObjectFiles || [];
        component.allIncludeDirs = component.allIncludeDirs
            ? component.allIncludeDirs.concat(includeDirs)
            : includeDirs;
        component.compilerOptions = component.compilerOptions
            ? component.compilerOptions.concat(compilerOptions)
            : compilerOptions;
        component.linkerOptions = component.linkerOptions
            ? component.linkerOptions.concat(linkerOptions)
            : linkerOptions;

        return this.getAllSources(taskOptions.projectOptions)
            .then(sources => {
                const tasks = {};
                for (const source of sources) {
                    tasks[`compile:${source.outputPath}`] = new CompileFileTask(source);
                }
                return tasks;
            });
    }

    getPrerequisites(projectOptions: ProjectOptions): string[] {
        return ['menuconfig-vars?'];
    }

    getPostRequisites(projectOptions: ProjectOptions): string[] {
        return ['link'];
    }

    getAllComponentOptions(projectOptions: ProjectOptions, option: string, resolveItemsToPaths: boolean): string[] {
        let allOptions = [];
        allOptions = allOptions.concat(projectOptions.includeDirs || []);
        for (let componentName of Object.keys(projectOptions.components)) {
            const component = projectOptions.components[componentName];
            if (!component) {
                continue;
            }
            allOptions = allOptions.concat((component[option] || []).map(opt => {
                if (resolveItemsToPaths) {
                    return path.resolve(component.componentDir, opt);
                }
                return opt;
            }));
        }
        return allOptions;
    }

    getAllSources(projectOptions: ProjectOptions): Promise<Source[]> {
        const tasks = [
            this.resolveAllSourceFiles(projectOptions, projectOptions.projectDir, projectOptions.sourceFiles),
            this.getAllSourcesInDirs(projectOptions, projectOptions.projectDir, projectOptions.sourceDirs)
        ];
        for (let componentName of Object.keys(projectOptions.components)) {
            const component = projectOptions.components[componentName];
            tasks.push(this.resolveAllSourceFiles(projectOptions, component.componentDir, component.sourceFiles));
            tasks.push(this.getAllSourcesInDirs(projectOptions, component.componentDir, component.sourceDirs));
        }
        return Promise.all(tasks)
            .then(results => {
                const all = [];
                for (const result of results) {
                    Array.prototype.push.apply(all, result);
                }
                return all;
            });
    }

    private resolveAllSourceFiles(projectOptions: ProjectOptions, rootDir: string, sourceFiles: string[]): Promise<Source[]> {
        return Promise.resolve(sourceFiles.map(filePath => {
            return this.createSource(projectOptions, rootDir, filePath);
        }));
    }

    private getAllSourcesInDirs(projectOptions: ProjectOptions, rootDir: string, sourceDirs: string[]): Promise<Source[]> {
        return Promise.all(sourceDirs.map(sourceDir => this.getAllSourcesInDir(projectOptions, rootDir, sourceDir)))
            .then(results => {
                const all: Source[] = [];
                for (const result of results) {
                    Array.prototype.push.apply(all, result);
                }
                return all;
            });
    }

    private getAllSourcesInDir(projectOptions: ProjectOptions, rootDir: string, dir: string): Promise<Source[]> {
        return glob('*+(.c|.cpp|.S|.s)', {cwd: path.resolve(rootDir, dir), dot: true, follow: true})
            .then(fileNames => {
                return fileNames.map(filePath => {
                    return this.createSource(projectOptions, rootDir, filePath)
                });
            });
    }

    private createSource(projectOptions: ProjectOptions, rootDir: string, filePath: string | Source): Source {
        if ((<Source>filePath).filePath) {
            return <Source>filePath;
        }
        const filePathWithoutExt = path.basename(<string>filePath, path.extname(<string>filePath));
        return {
            filePath: path.join(projectOptions.projectDir, rootDir, <string>filePath),
            outputPath: path.join(projectOptions.buildDir, rootDir, filePathWithoutExt) + '.o',
            depPath: path.join(projectOptions.buildDir, rootDir, filePathWithoutExt) + '.d',
        };
    }
}
