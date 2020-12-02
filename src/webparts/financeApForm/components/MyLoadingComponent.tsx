import React, { Component } from 'react';

import { Shimmer } from 'office-ui-fabric-react/lib/Shimmer';


class MyLoadingComponent extends Component {
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

export default MyLoadingComponent;