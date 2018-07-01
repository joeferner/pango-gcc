import {FileUtils, ProjectOptions, Shell, Target, Targets} from "pango";
import {GccOptions, getGccOptions} from "./GccOptions";
import * as path from "path";

export class GccLinkTarget implements Target {
    preRequisites = ['compile'];

    async run(projectOptions: ProjectOptions): Promise<void | Targets | string[]> {
        if (!projectOptions.buildDir) {
            throw new Error(`Missing "buildDir" configuration.`);
        }

        const options: GccOptions = getGccOptions(projectOptions);
        if (!options.allObjectFiles || options.allObjectFiles.length === 0) {
            throw new Error(`No object files to link`);
        }

        const outputFile = options.outputFile || path.join(projectOptions.buildDir, options.outputFileName);
        options.outputFile = outputFile;
        const shouldRun = await FileUtils.isOutputFileOlderThenInputFiles(outputFile, options.allObjectFiles);
        if (shouldRun) {
            const cmd = [
                options.linker,
            ].concat(this.getLinkerOptions(projectOptions, options, outputFile));
            projectOptions.logger.info(cmd.join(' '));
            await Shell.shell(projectOptions, cmd);
        }
    }

    private getLinkerOptions(projectOptions: ProjectOptions, options: GccOptions, outputFile: string): string[] {
        let results = [];
        results = results.concat(projectOptions.linkerOptions || []);
        results = results.concat(options.linkerOptions || []);
        results = results.concat(['-o', outputFile]);
        results = results.concat(options.allObjectFiles);
        return results;
    }
}
