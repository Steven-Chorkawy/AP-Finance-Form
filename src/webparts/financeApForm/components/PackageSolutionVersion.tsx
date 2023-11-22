import { Text } from '@fluentui/react';
import * as React from 'react';
// Require this to display version number.
const packageSolution: any = require('../../../../config/package-solution.json');

export default class PackageSolutionVersion extends React.Component<{}, {}> {
    constructor(props: any) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        return (
            <div className='no-print'>
                <Text variant='tiny' title='SharePoint SPFx App Version.'>App Version: {packageSolution.solution.version}</Text>
            </div>
        );
    }
}