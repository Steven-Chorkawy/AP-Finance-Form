import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { GetInvoiceByStatus, GetInvoiceStatusColumn } from '../MyHelperMethods';
import { IAPInvoiceQueryItem } from '../interfaces/IInvoice';
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import "@pnp/sp/profiles";
import "@pnp/sp/items/get-all";
import './MyLoadingComponent';
import { MyLoadingComponent } from './MyLoadingComponent';
import { DefaultEffects, Dropdown, List, Stack, TextField } from '@fluentui/react';

export interface IFinanceApForm2Props {
    description: string;
    defaultInvoiceLink: string;
    context: WebPartContext;
}

export interface IFinanceApForm2State {
    allInvoices: IAPInvoiceQueryItem[];
    invoiceStatus: string[];
    myFilter: IFinanceAPForm2FilterState;
}

interface IFinanceAPForm2FilterState {
    status: string;           // The Status selected status.
    showChequeReq: boolean;   // If we want to show cheque reqs or not. 
    searchBoxFilterObject?: any;
    searchBoxLength?: number;
    invoiceDateDesc: boolean; // default to newest to oldest. 
}

export class FinanceApForm2 extends React.Component<IFinanceApForm2Props, IFinanceApForm2State> {
    constructor(props) {
        super(props);

        this.state = {
            allInvoices: undefined,
            invoiceStatus: [],
            myFilter: {
                status: this.props.description ? this.props.description : 'Approved',
                showChequeReq: false,
                invoiceDateDesc: true
            },
        }

        this.queryInvoices();
        GetInvoiceStatusColumn().then(value => {
            this.setState({ invoiceStatus: value });
        });
    }


    private queryInvoices = async (): Promise<void> => {
        console.log('querying invoices');
        let invoices: IAPInvoiceQueryItem[] = await GetInvoiceByStatus(this.state.myFilter.status);
        console.log('Invoices Found');
        console.log(invoices);

        this.setState({ allInvoices: invoices });
    }


    private onListRenderCell = (item: IAPInvoiceQueryItem, index: number | undefined) => {
        return (<div style={{ boxShadow: DefaultEffects.elevation8, marginBottom: '15px', padding: '10px' }}>
            Title: {item.Title} | Index: {index}
        </div>);
    }

    public render(): React.ReactElement<IFinanceApForm2Props> {
        return (
            <div style={{ marginRight: '20px', marginLeft: '20px' }}>
                <Stack horizontal horizontalAlign="space-around">
                    <Stack.Item grow={1}>
                        <Dropdown
                            placeholder='Filter by Invoice Status'
                            options={this.state.invoiceStatus.map(status => { return { key: status, text: status } })}
                            defaultSelectedKey={this.state.myFilter.status}
                            onChange={(event, option) => {
                                this.setState({
                                    myFilter: { ...this.state.myFilter, status: option.text },
                                    allInvoices: undefined
                                }, () => this.queryInvoices());
                            }}
                        />
                    </Stack.Item>
                    <Stack.Item grow={4}>
                        <TextField
                            placeholder='Search by Title, Vendor, Invoice #, PO #, Batch #'
                        />
                    </Stack.Item>
                </Stack>
                {
                    this.state.allInvoices ? <div>{this.state.myFilter.status}: {this.state.allInvoices.length}</div> : <MyLoadingComponent />
                }

                {
                    this.state.allInvoices ?
                        <div style={{ overflow: 'auto', maxHeight: '800px' }} data-is-scrollable>
                            <List
                                items={this.state.allInvoices}
                                onRenderCell={this.onListRenderCell}
                            />
                        </div> :
                        <MyLoadingComponent />
                }
            </div>
        );
    }
}