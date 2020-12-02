import * as React from 'react';

import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';

export class MyLoadingComponent extends React.Component {
    render() {
        return (
            <div>
                <Shimmer />
                <Shimmer width="75%" />
                <Shimmer width="50%" />
                <Shimmer />
                <Shimmer width="75%" />
                <Shimmer width="50%" />
            </div>
        );
    }
}