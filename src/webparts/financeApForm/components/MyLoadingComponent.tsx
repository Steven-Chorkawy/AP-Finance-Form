import * as React from 'react';

import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';

export class MyLoadingComponent extends React.Component {
    public render() {
        const styleObj = { margin: '10px 0' };

        return (
            <div>
                <Shimmer style={styleObj} />
                <Shimmer style={styleObj} width="75%" />
                <Shimmer style={styleObj} width="50%" />
                <Shimmer style={styleObj} />
                <Shimmer style={styleObj} width="75%" />
                <Shimmer style={styleObj} width="50%" />
            </div>
        );
    }
}