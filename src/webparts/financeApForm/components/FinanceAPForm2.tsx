import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import * as MyHelper from '../MyHelperMethods';
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
import { DefaultEffects, Dropdown, List, Spinner, SpinnerSize, Stack, TextField } from '@fluentui/react';
import { Form, Field, FormElement, FieldWrapper, FieldArray, FormRenderProps } from '@progress/kendo-react-form';
import { Card, CardTitle, CardHeader, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { GetInvoiceByStatus, GetInvoiceStatusColumn } from '../MyHelperMethods';
import { Chip } from '@progress/kendo-react-buttons';



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
        let cardTitleTextAlignStyle = { display: 'inline-block', width: '110px' };

        return (<div style={{ boxShadow: DefaultEffects.elevation8, margin: '10px' }}>
            <div>
                <Form
                    key={`${item.ID}-${item.Modified}`}
                    onSubmit={(value) => {
                        console.log('on form submit');
                        console.log(value);
                    }}
                    initialValues={item}
                    render={(formRenderProps) => (
                        <FormElement>
                            <Card>
                                <CardHeader>
                                    <div className='row'>
                                        <div className='col-xs-10 col-sm-10'>
                                            <div className='row'>
                                                <div className='col-xs-12 col-sm-12'>
                                                    <CardTitle style={{ marginBottom: '7px' }}>
                                                        {
                                                            formRenderProps.valueGetter('Vendor_x0020_Name') && formRenderProps.valueGetter('Vendor_x0020_Number') &&
                                                            <span>
                                                                <span title='Vendor Name'>{formRenderProps.valueGetter('Vendor_x0020_Name')}</span> | <span title='Vendor ID'>{formRenderProps.valueGetter('Vendor_x0020_Number')}</span>
                                                            </span>
                                                        }
                                                    </CardTitle>
                                                </div>
                                                <div className='col-xs-12 col-sm-8'>
                                                    <CardTitle>
                                                        <span title='Invoice Number'><span style={cardTitleTextAlignStyle}>Invoice Number:</span> {formRenderProps.valueGetter('Invoice_x0020_Number')}</span>
                                                    </CardTitle>
                                                    <CardTitle>
                                                        <span>
                                                            <span style={cardTitleTextAlignStyle}>Invoice Title:</span>
                                                            <a
                                                                title='Click to View or Upload Documents.'
                                                                target='_blank'
                                                                data-interception='off'
                                                                href={this.props.defaultInvoiceLink ? `${this.props.defaultInvoiceLink}&id=%2Fsites%2FFinance%2FInvoices%2F${formRenderProps.valueGetter('Title')}` : `https://claringtonnet.sharepoint.com/sites/Finance/Invoices/Forms/N2.aspx?viewid=a90c5a61-821b-43e6-a9b0-148324fdb09d&id=%2Fsites%2FFinance%2FInvoices%2F${formRenderProps.valueGetter('Title')}`}
                                                            >
                                                                {formRenderProps.valueGetter('Title')}
                                                            </a>
                                                        </span>
                                                    </CardTitle>
                                                    <CardTitle>
                                                        <span><span style={cardTitleTextAlignStyle}>Gross Amount:</span><span>{MyHelper.FormatCurrency(formRenderProps.valueGetter('Gross_x0020_Amount'))}</span></span>
                                                    </CardTitle>
                                                    <CardTitle style={{ height: '22px' }}>
                                                        <span title={`Sum of ${formRenderProps.valueGetter('Accounts') ? formRenderProps.valueGetter('Accounts').length : 0} Accounts`}>
                                                            <Stack horizontal={true} verticalAlign='center' >
                                                                <span style={cardTitleTextAlignStyle}>Amount Assigned:</span>
                                                                {
                                                                    formRenderProps.valueGetter('Accounts')
                                                                        ? MyHelper.SumAccounts(formRenderProps.valueGetter('Accounts')) !== MyHelper.FormatCurrency(formRenderProps.valueGetter('Gross_x0020_Amount'))
                                                                            ? <Chip
                                                                                style={{ fontSize: '1.25rem', height: '20px' }}
                                                                                text={MyHelper.SumAccounts(formRenderProps.valueGetter('Accounts'))}
                                                                                themeColor='error' />
                                                                            : <span>{MyHelper.SumAccounts(formRenderProps.valueGetter('Accounts'))}</span>
                                                                        : <span title='Loading Account Details...'><Spinner size={SpinnerSize.small} /></span>
                                                                }
                                                            </Stack>
                                                        </span>
                                                    </CardTitle>
                                                </div>
                                                <div className='col-xs-12 col-sm-4'>
                                                    <CardSubtitle style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                                                        <div title='Invoice Date' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Date:</span>
                                                            {
                                                                formRenderProps.valueGetter('Invoice_x0020_Date') &&
                                                                `${new Date(formRenderProps.valueGetter('Invoice_x0020_Date')).getMonth()}/${new Date(formRenderProps.valueGetter('Invoice_x0020_Date')).getDay()}/${new Date(formRenderProps.valueGetter('Invoice_x0020_Date')).getFullYear()}`
                                                            }
                                                        </div>
                                                        <div title='Invoice Type' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Type:</span><span>{formRenderProps.valueGetter('Invoice_x0020_Type')}</span>
                                                        </div>
                                                        <div title='Invoice Status' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Status:</span><span>{formRenderProps.valueGetter('OData__Status')}</span>
                                                        </div>
                                                        <div title='Batch #' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Batch:</span><span>{formRenderProps.valueGetter('Batch_x0020_Number')}</span>
                                                        </div>
                                                    </CardSubtitle>
                                                </div>
                                            </div>
                                        </div>
                                        {/* <div className='col-xs-2 col-sm-2'>
                                        <Button
                                            style={{ float: 'right' }}
                                            fillMode="flat"
                                            svgIcon={this.state.showMore ? minusIcon : plusIcon}
                                            title={this.state.showMore ? 'Show Less' : 'Show More'}
                                            onClick={e => {
                                                e.preventDefault(); // ! Why is this button submitting the form???!!
                                                this.setState({ showMore: !this.state.showMore, saveButtonDisabled: false, cancelButtonDisabled: false });
                                            }}
                                        />
                                        {
                                            !this.state.showMore && !formRenderProps.modified &&
                                            <Button
                                                style={{ float: 'right' }}
                                                themeColor={"primary"}
                                                fillMode="flat"
                                                svgIcon={pencilIcon}
                                                title='Edit Invoice'
                                                onClick={() => this.setState({ showMore: !this.state.showMore, saveButtonDisabled: false, cancelButtonDisabled: false })}
                                            />
                                        }
                                        {
                                            formRenderProps.modified &&
                                            <Button
                                                style={{ float: 'right' }}
                                                fillMode="flat"
                                                svgIcon={cancelIcon}
                                                title='Cancel Changes'
                                                onClick={formRenderProps.onFormReset}
                                                disabled={this.state.cancelButtonDisabled}
                                            />
                                        }
                                        {
                                            formRenderProps.modified &&
                                            <Button
                                                style={{ float: 'right' }}
                                                fillMode="flat"
                                                svgIcon={saveIcon}
                                                themeColor={"primary"}
                                                title='Save Changes'
                                                type='submit'
                                                disabled={this.state.saveButtonDisabled}
                                            />
                                        }
                                    </div> */}
                                    </div>
                                    {/* {
                                    this.props.dataItem && this.props.dataItem.saveSuccess === false &&
                                    <MessageBar messageBarType={MessageBarType.error}>
                                        Something went wrong.  Could not save your changes at this time.
                                    </MessageBar>
                                }
                                {
                                    formRenderProps.visited && formRenderProps.errors && formRenderProps.errors.VALIDATION_SUMMARY &&
                                    <MessageBar messageBarType={MessageBarType.error}>
                                        {formRenderProps.errors.VALIDATION_SUMMARY}
                                    </MessageBar>
                                } */}
                                </CardHeader>
                            </Card>
                        </FormElement>
                    )}
                />
            </div>
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