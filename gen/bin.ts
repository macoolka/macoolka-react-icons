/**
 * @file bin file
 */

import { main } from '.';
import {error} from 'macoolka-console';

// tslint:disable-next-line: no-console
main().catch(e => {
    error(`Unexpected error: ${e}`)
    console.error(e)
});
