import {Target} from "pango";
import {ProjectOptions, Targets} from "pango";
import {GccCompileFileTarget} from "./GccCompileFileTarget";

export class GccAddSourceFilesTarget implements Target {
    preRequisites = ['generate-sources'];
    postRequisites = ['compile'];

    async run(projectOptions: ProjectOptions): Promise<void | Targets | string[]> {
        if (!projectOptions.sourceFiles) {
            return;
        }

        const results = {};
        for (let sourceFile of projectOptions.sourceFiles) {
            results[`gcc-compile:${sourceFile.fileName}`] = new GccCompileFileTarget(sourceFile);
        }
        return results;
    }
}
