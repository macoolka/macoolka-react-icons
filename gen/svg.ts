import SVGO from 'svgo';
import * as Mustache from 'mustache';
import { pipe } from 'fp-ts/lib/pipeable';
import { format } from 'macoolka-prettier'
import { Task } from 'fp-ts/lib/Task'
const svgo = new SVGO({
    floatPrecision: 4,
    plugins: [
        { cleanupAttrs: true },
        { removeDoctype: true },
        { removeXMLProcInst: true },
        { removeComments: true },
        { removeMetadata: true },
        { removeTitle: true },
        { removeDesc: true },
        { removeUselessDefs: true },
        { removeXMLNS: true },
        { removeEditorsNSData: true },
        { removeEmptyAttrs: true },
        { removeHiddenElems: true },
        { removeEmptyText: true },
        { removeEmptyContainers: true },
        { removeViewBox: true },
        { cleanupEnableBackground: true },
        { minifyStyles: true },
        { convertStyleToAttrs: true },
        { convertColors: true },
        { convertPathData: true },
        { convertTransform: true },
        { removeUnknownsAndDefaults: true },
        { removeNonInheritableGroupAttrs: true },
        { removeUselessStrokeAndFill: true },
        { removeUnusedNS: true },
        { cleanupIDs: true },
        { cleanupNumericValues: true },
        { cleanupListOfValues: true },
        { moveElemsAttrsToGroup: true },
        { moveGroupAttrsToElems: true },
        { collapseGroups: true },
        { removeRasterImages: true },
        { mergePaths: true },
        { convertShapeToPath: true },
        { sortAttrs: true },
        { removeDimensions: true },
        { removeAttrs: true },
        { removeElementsByAttr: true },
        { removeStyleElement: true },
        { removeScriptElement: true },
    ],
});
export interface Input {
    name: string
    data: string,
    template: string,
    className: string
}
export interface OutPut {
    content: string,
    className: string
}
export const parseFileToJSX = ({ data, template, className, name }: Input): Task<OutPut> => async () => {
    const input = data
        .replace(/ fill="#010101"/g, '')
        .replace(/<rect fill="none" width="24" height="24"\/>/g, '')
        .replace(/<rect id="SVGID_1_" width="24" height="24"\/>/g, '');

    const result = await svgo.optimize(input);

    // Extract the paths from the svg string
    // Clean xml paths
    let paths = result.data
        .replace(/<svg[^>]*>/g, '')
        .replace(/<\/svg>/g, '')
        .replace(/"\/>/g, '" />')
        .replace(/fill-opacity=/g, 'fillOpacity=')
        .replace(/xlink:href=/g, 'xlinkHref=')
        .replace(/clip-rule=/g, 'clipRule=')
        .replace(/fill-rule=/g, 'fillRule=')
        .replace(/ clip-path=".+?"/g, '') // Fix visibility issue and save some bytes.
        .replace(/<clipPath.+?<\/clipPath>/g, ''); // Remove unused definitions

    const sizeMatch = name.match(/^.*_([0-9]+)px.svg$/);
    const size = sizeMatch ? Number(sizeMatch[1]) : null;

    if (size&& size !== 24) {
        const scale = Math.round((24 / size!) * 100) / 100; // Keep a maximum of 2 decimals
        paths = paths.replace('clipPath="url(#b)" ', '');
        paths = paths.replace(/<path /g, `<path transform="scale(${scale}, ${scale})" `);
    }

    return ({
        className,
        content: pipe(
            Mustache.render(template, {
                paths,
                className,
            }),
            content => format({ content, parser: 'typescript' })
        )
    });
}