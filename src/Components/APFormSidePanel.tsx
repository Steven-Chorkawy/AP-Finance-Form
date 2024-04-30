import * as React from 'react';

import { PopupPropsContext } from '@progress/kendo-react-popup';
import { Panel, PanelType } from '@fluentui/react';

export interface IAPFormSidePanelProps {
    isOpen?: boolean;
    panelType?: PanelType;
    context: any;
}

export default class APFormSidePanel extends React.Component<IAPFormSidePanelProps, any> {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: this.props.isOpen
        };
    }

    public render(): React.ReactElement<any> {

        return (
            <Panel
                isLightDismiss={false}
                isOpen={this.state.isOpen}
                type={this.props.panelType ? this.props.panelType : PanelType.custom}
                onDismiss={() => this.setState({ isOpen: !this.state.isOpen })}
                customWidth={'800px'}
            >
                <div>
                    <PopupPropsContext.Provider value={props => ({ ...props })}>
                        <h1>hello world!</h1>
                    </PopupPropsContext.Provider>
                </div>
            </Panel >
        );
    }
}
