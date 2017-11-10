import {BuildTarget} from "./BuildTarget";
import {ProjectOptions} from "pango";
import {ComponentWithMenuConfig, MenuConfigContext} from "pango-menuconfig";
import {GccComponentOptions} from "./GccComponentOptions";

export const COMPONENT_NAME = 'gcc';

export class BuildComponent implements ComponentWithMenuConfig {
    public name: string;

    constructor() {
        this.name = COMPONENT_NAME;
    }

    init(projectOptions: ProjectOptions) {
        const componentOptions: GccComponentOptions = projectOptions.components[this.name];
        componentOptions.targets.build = new BuildTarget();
        componentOptions.compilers = componentOptions.compilers || {};
        componentOptions.compilerOptions = componentOptions.compilerOptions || [];
        return Promise.resolve();
    }

    static getDefaultCompilers() {
        return {
            '.c': 'gcc',
            '.cpp': 'gcc',
            '.s': 'gcc'
        };
    }

    static getDefaultLinker(): string {
        return 'gcc';
    }

    menuConfig(ctx: MenuConfigContext, componentData: any): Promise<any> {
        ctx.clear();
        return ctx.inquirer.prompt({
            type: 'list',
            name: 'opt',
            message: 'gcc Options',
            choices: this.getCompilerMenuOptions(componentData.compilers).concat([
                `Linker -> ${componentData.linker || BuildComponent.getDefaultLinker()}`,
                new ctx.inquirer.Separator(),
                'Back'
            ])
        }).then(({opt}) => {
            if (opt === 'Back') {
                return componentData;
            }
            const m = opt.match(/(.*) -> (.*)/);
            return ctx.inquirer.prompt({
                type: 'input',
                name: 'value',
                message: m[1],
                default: m[2]
            }).then(({value}) => {
                if (m[1] === 'Linker') {
                    componentData.linker = value;
                } else if (m[1].startsWith('Compiler')) {
                    const mCompiler = m[1].match(/Compiler \((.*?)\)/);
                    componentData.compilers = componentData.compilers || {};
                    componentData.compilers[mCompiler[1]] = value;
                } else {
                    throw new Error(`bad key ${m[1]}`);
                }
                return this.menuConfig(ctx, componentData);
            });
        });
    }

    private getCompilerMenuOptions(compilers): string[] {
        compilers = {
            ...BuildComponent.getDefaultCompilers(),
            ...compilers
        };
        return Object.keys(compilers)
            .map(compilerExt => {
                return `Compiler (${compilerExt}) -> ${compilers[compilerExt]}`;
            });
    }
}
