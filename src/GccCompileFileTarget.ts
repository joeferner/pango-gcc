import {FileUtils, ProjectOptions, Shell, Target, Targets} from "pango";
import * as path from "path";
import {GccOptions, getGccOptions} from "./GccOptions";
import * as fs from "fs-extra";

export interface GccCompileFileInfo {
    fileName: string,
    outputPath?: string,
    depPath?: string
}

export class GccCompileFileTarget implements Target {
    preRequisites = ['generate-sources'];
    postRequisites = ['compile'];
    private readonly _fileName: string;
    private _outputPath: string;
    private _depPath: string;

    constructor(fileName: string | GccCompileFileInfo) {
        if (!fileName) {
            throw new Error(`fileName is required`);
        }
        if (typeof fileName === 'string') {
            this._fileName = <string>fileName;
        } else {
            const fileInfo = <GccCompileFileInfo>fileName;
            this._fileName = fileInfo.fileName;
            this._outputPath = fileInfo.outputPath;
            this._depPath = fileInfo.depPath;
        }
    }

    async run(projectOptions: ProjectOptions): Promise<void | Targets | string[]> {
        const options: GccOptions = getGccOptions(projectOptions);

        const filePathWithoutExt = path.basename(this._fileName, path.extname(this._fileName));
        if (!projectOptions.buildDir) {
            throw new Error(`Missing "buildDir" configuration.`);
        }
        const relativePath = path.dirname(path.relative(projectOptions.projectDir, this._fileName));
        this._outputPath = this._outputPath || path.join(projectOptions.buildDir, relativePath, filePathWithoutExt) + '.o';
        this._depPath = this._depPath || path.join(projectOptions.buildDir, relativePath, filePathWithoutExt) + '.d';

        if (await this.shouldExecute(projectOptions)) {
            await this.compileAndDeps(projectOptions, options);
        }
        options.allObjectFiles.push(this._outputPath);
    }

    private async shouldExecute(projectOptions: ProjectOptions): Promise<boolean> {
        return await FileUtils.isOutputFileOlderThenInputFiles(this._outputPath, this.getInputFiles());
    }

    private async getInputFiles(): Promise<string[]> {
        if (this._fileName.match(/\.s|\.S$/)) {
            return [this._fileName];
        }
        const exists = await fs.pathExists(this._depPath);
        if (!exists) {
            return [];
        }
        const depContents = await fs.readFile(this._depPath, 'utf8');
        const depLines = depContents.trim().split('\n')
            .map(line => line.replace(/\\$/, '').trim());
        depLines[0] = depLines[0].replace(/.*?:/, '').trim();
        return depLines.filter(dep => {
            return dep && dep.length > 0;
        });
    }

    private async compileAndDeps(projectOptions: ProjectOptions, options: GccOptions): Promise<void> {
        const ext = path.extname(this._fileName).toLowerCase();
        const compiler = options.compilers[ext];
        if (!compiler) {
            throw new Error(`Could not find compiler for extension ${ext}`);
        }

        const compilerOptions = this.getCompilerOptions(projectOptions, options);

        await fs.mkdirs(path.dirname(this._outputPath));
        await this.compile(projectOptions, compiler, compilerOptions);
        await this.createDeps(projectOptions, compiler, compilerOptions);
    }

    private async compile(projectOptions: ProjectOptions, compiler: string, compilerOptions: string[]) {
        const cmd = [compiler, '-c']
            .concat(compilerOptions)
            .concat(['-o', this._outputPath]);
        projectOptions.logger.info(cmd.join(' '));
        await Shell.shell(projectOptions, cmd);
    }

    private async createDeps(projectOptions: ProjectOptions, compiler: string, compilerOptions: string[]) {
        const cmd = [compiler, '-MM']
            .concat(compilerOptions)
            .concat(['-o', this._depPath]);
        return Shell.shell(projectOptions, cmd);
    }

    private getCompilerOptions(projectOptions: ProjectOptions, options: GccOptions): string[] {
        let results = [];
        results = results.concat(projectOptions.compilerOptions || []);
        results = results.concat(options.compilerOptions || []);
        results = results.concat(this.getIncludeDirs(projectOptions, options).reduce((all, s) => {
            return all.concat(['-I', s])
        }, []));
        results = results.concat([this._fileName]);
        return results;
    }

    private getIncludeDirs(projectOptions: ProjectOptions, options: GccOptions) {
        return (projectOptions.includeDirs || []).concat(options.includeDirs || []);
    }
}
