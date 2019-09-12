import { toUpperFirstLetter, } from 'macoolka-string';
import * as E from 'fp-ts/lib/Either'
import * as O from 'fp-ts/lib/Option'

import { pipe } from 'fp-ts/lib/pipeable';
import { MonadFileStore, FileQueryData, pathToFile } from 'macoolka-store-core';
import { MonadLog } from 'macoolka-log-core';
import * as A from 'fp-ts/lib/Array';
import { MonidI18N } from 'macoolka-i18n';
import { MonadFunction } from 'macoolka-app/lib/MonadFunction';
import * as MF from 'macoolka-app/lib/MonadFunction';
import * as MN from 'macoolka-app/lib/MonadNode';
import * as path from 'path'
import { showUnknow } from 'macoolka-object'
import {parseFileToJSX} from './svg'
/**
 * @since 0.2.0
 */
export interface Capabilities extends MonadFileStore, MonadLog {
    srcDir: string;
    pattern: string;
    outDir: string;
    template: string,
    clear:string|string[],
}

/**
 * App effect
 *
 * @since 0.2.0
 */
export interface MonadDoc<A> extends MonadFunction<Capabilities, A> { }
/**
 * parse materail-design-icons file name
 * @param path 
 */
export const parseMaterialPathToName = ({ name }: FileQueryData): E.Either<MonidI18N, string> => {

    const names = pipe(
        path.parse(name).name.split('_'),
        A.init,
        O.getOrElse(() => [])
    );

    return pipe(
        names,
        E.fromPredicate(a => a.length >= 2, () => () => `The length that filename split '_' must bigger than 3.'${JSON.stringify(names)}' `),
        E.chain(a => a[0] !== 'ic'
            ? E.left(() => `filename must start with 'ic''${name}'`)
            : E.right(a)),
        E.map(a => a.map(toUpperFirstLetter).join(''))
    )
}

export const read24Files: MonadDoc<FileQueryData[]> = a => {
    return pipe(
        a.glob({ container: a.srcDir, pattern: a.pattern }),
        MN.map(files => pipe(
            files,
            A.map(file => ({ ...file, name: file.name.replace(' ', '_') }))
        ))
    )

}
export interface Input {
    data: string,
    template: string,
    className: string
}
export interface OutPut {
    content: string,
    className: string
}

export const parseFile = (file: FileQueryData): MonadDoc<OutPut> => M => pipe(
    file,
    M.readTextFile,
    MN.chain(({ data }) => pipe(
        parseMaterialPathToName(file),
        MN.fromEither,
        MN.chain(className =>
            MN.rightTask(parseFileToJSX({ data, className, template: M.template ,name:file.name}))
        ),
     ))


)

export const writeFile = ({ className, content }: OutPut): MonadDoc<any> => M =>
    M.createFile({
        container: M.outDir,
        folders: [],
        name: `${className}.tsx`, data: content
    })


const _main: MonadDoc<number> =
    pipe(
        read24Files,
        MF.chain(as => pipe(
            as,
            A.map((file: any) => parseFile(file)),
            A.array.sequence(MF.readerTaskEither),
            MF.map(as => pipe(
                as,
                A.uniq({ equals: (a, b) => a.className === b.className })
            )),

            MF.chain(as => pipe(
                as,
                A.map(writeFile),
                A.array.sequence(MF.readerTaskEither),
            )
            ))),
        MF.map(as => as.length)
    )

export const main: MonadDoc<number> = M =>
    pipe(
        M.readTextFile(pathToFile('')(M.template)),
        MN.chainFirst(() => M.info(`read template from ${showUnknow.show(M.template)}.`)),
        MN.chainFirst(() =>pipe(
            M.glob({ container: M.outDir, pattern: M.clear }),
            MN.chain(as=>pipe(
                as,
                A.map(M.deleteFile),
                MN.parallel
            )),
            MN.chainFirst(as => M.info(`delete ${as.length} files in ${showUnknow.show(M.outDir)}.`)),
        ) ),
        MN.chain(a => _main({ ...M, template: a.data })),
        MN.chainFirst(as => M.info(`total count:${as}`)),
    )
