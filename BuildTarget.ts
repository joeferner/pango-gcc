import {ProjectOptions, Target, Tasks} from "pango";
import {LinkTask} from "./LinkTask";
import {CompileTask} from "./CompileTask";

export class BuildTarget extends Target {
    get helpMessage(): string {
        return 'compile and link application';
    }

    getTasks(projectOptions: ProjectOptions): Promise<Tasks> {
        return Promise.resolve({
            compile: new CompileTask(),
            link: new LinkTask()
        });
    }
}
