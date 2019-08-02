import {ProjectOptions, Target, Targets} from "pango";

export class GccInitializeTarget implements Target {
    postRequisites = ['initialize'];

    async run(projectOptions: ProjectOptions): Promise<void | Targets | string[]> {
        projectOptions.compilerOptions = projectOptions.compilerOptions || [];
        projectOptions.linkerOptions = projectOptions.linkerOptions || [];
        projectOptions.includeDirs = projectOptions.includeDirs || [];
    }
}
