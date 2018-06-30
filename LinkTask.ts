import {FileUtils, Task, TaskOptions} from "pango";
import {BuildComponent, COMPONENT_NAME} from "./BuildComponent";
import {GccComponentOptions} from "./GccComponentOptions";
import * as path from "path";

export class LinkTask extends Task {
    async run(taskOptions: TaskOptions): Promise<void> {
        const component: GccComponentOptions = taskOptions.projectOptions.components[COMPONENT_NAME];
        const linker = component.linker || BuildComponent.getDefaultLinker();
        const outputFile = component.outputFile || path.join(taskOptions.projectOptions.buildDir, component.outputFileName || 'a.out');
        component.outputFile = outputFile;
        const shouldRun = await FileUtils.isOutputFileOlderThenInputFiles(outputFile, component.allObjectFiles);
        if (shouldRun) {
            const cmd = [
                linker,
            ].concat(this.getLinkerOptions(component, outputFile));
            taskOptions.log.info(cmd.join(' '));
            await this.shell(taskOptions, cmd);
        }
    }

    private getLinkerOptions(component: GccComponentOptions, outputFile: string): string[] {
        let options = [];
        options = options.concat(component.linkerOptions || []);
        options = options.concat(['-o', outputFile]);
        options = options.concat(component.allObjectFiles);
        return options;
    }
}
