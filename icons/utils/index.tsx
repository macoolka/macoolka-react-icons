import * as React from 'react';
import { withValue } from 'macoolka-react-core/lib/reactHelper';
import IconSvg from 'macoolka-react-core/lib/IconSvg';

const createSvgIcon = (path: React.ReactElement<{}>, displayName: string) => {
     const Icon = withValue(IconSvg,
        {
            size: 'medium',
            children:
                <svg viewBox="0 0 24 24" >
                    {path}
                </svg>
        });

    Icon.displayName = displayName;
    return Icon;
};

export default createSvgIcon;