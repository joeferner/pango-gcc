import {ProjectOptions, Targets} from "pango";
import * as path from "path";
import * as glob from "glob-promise";
import {GccCompileFileTarget} from "./GccCompileFileTarget";

export class GccTargetBuilder {
    static async createTargets(projectOptions: ProjectOptions, dirName: string): Promise<Targets> {
        const cwd = path.resolve(projectOptions.projectDir, dirName);
        const fileNames = await glob('*+(.c|.cpp|.S|.s)', {cwd, dot: true, follow: true});
        const results = {};
        for (let fileName of fileNames) {
            results[`gcc-compile:${fileName}`] = new GccCompileFileTarget(path.join(cwd, fileName));
        }
        return results;
    }
}
