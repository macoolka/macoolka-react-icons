/**
 * @file
 */
import * as IO from 'fp-ts/lib/IO';
import { pipe } from 'fp-ts/lib/pipeable';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import * as core from './build';
import buildStore from 'macoolka-store-fs';
import { join } from 'path'
import consoleLog, { log, info } from 'macoolka-console';

const capabilities: core.Capabilities = {
    ...TE.taskEither,
    ...buildStore(process.cwd()),
    ...consoleLog,
    template: 'gen/tpl.template',
    srcDir: join('node_modules', 'material-design-icons'),
    outDir: join('src'),
    pattern: './**/ic_*_24px.svg',
    clear:'*.tsx',
};

const exit = (code: 0 | 1): IO.IO<void> => () => process.exit(code);

function onLeft(e: string): T.Task<void> {

    return T.fromIO(
        pipe(
            () => log(e),
            IO.chain(() => exit(1))
        )
    );
}

function onRight(): T.Task<void> {
    return T.fromIO(() => info('Docs generation succeeded!'));
}

/**
 * parse file in process directory (node_modules/material-design-icons中的.\/\*\*\/\*_24px.svg) and generate ts file
 * @desczh
 * 解析process目录node_modules/material-design-icons中的.\/\*\*\/\*_24px.svg文件，产生ts到src目录
 * @since 0.2.0
 */
export const main: T.Task<void> = pipe(
    core.main(capabilities),
    TE.mapLeft(a => a({})),
    TE.fold(onLeft, onRight)
);
