import * as React from 'react';
import Moment from 'react-moment';

// My Imports
import * as MyHelper from '../MyHelperMethods';

// PnP imports. 
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";

// Kendo Imports 
import { Card, CardTitle, CardHeader, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { Button } from '@progress/kendo-react-buttons';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Label, Error } from '@progress/kendo-react-labels';
import { Input, NumericTextBox, TextArea } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { IInvoice } from '../interfaces/IInvoice';

// Fluent UI Imports
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

/**
 * Renders the Accounts Grid.
 * @param fieldArrayRenderProps Props from form
 */
const AccountFieldComponent = (fieldArrayRenderProps) => {
    return (
        <Grid data={fieldArrayRenderProps.value}>
            <GridToolbar>
                <Button title="Add new" icon='plus' primary={true} look='flat' onClick={e => console.log(e)} >Add Account</Button>
            </GridToolbar>
            <GridColumn field="Title" title="Account Code" />
            <GridColumn field="AmountIncludingTaxes" title={`Amount Including Taxes (${MyHelper.SumAccounts(fieldArrayRenderProps.value)})`} />
        </Grid>
    );
};

export class APItemComponent extends React.Component<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            item: this.props.dataItem,
            inEdit: false,
            showMore: false
        };
    }

    public componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.dataItem.ID !== this.props.dataItem.ID) {
            this.setState({
                item: this.props.dataItem
            });
        }
    }

    public render() {
        let item: IInvoice = this.state.item;
        return (
            <Form
                key={item.ID}
                onSubmit={e => console.log(e)}
                initialValues={item}
                render={formRenderProps => (
                    <FormElement style={{ marginTop: '0px' }}>
                        <Card style={{ marginBottom: '10px', marginLeft: '2px', marginRight: '2px', fontSize: '1.5rem', paddingTop: '0px' }}>
                            <div style={{ cursor: 'pointer' }} onClick={() => this.setState({ showMore: !this.state.showMore })}>
                                <CardHeader>
                                    <div className='row'>
                                        <div className='col-xs-10 col-sm-10'>
                                            <div className='row'>
                                                <div className='col-xs-12 col-sm-8'>
                                                    <CardTitle>
                                                        <span title='Vendor Name'>{formRenderProps.valueGetter('Vendor_x0020_Name')}</span> | <span title='Vendor ID'>{formRenderProps.valueGetter('Vendor_x0020_Number')}</span>
                                                    </CardTitle>
                                                    <CardTitle>
                                                        <span title='Invoice Number'>Invoice Number: {formRenderProps.valueGetter('Invoice_x0020_Number')}</span>
                                                    </CardTitle>
                                                    <CardTitle>
                                                        <span>Invoice Title: <a target='_blank' href={`https://claringtonnet.sharepoint.com/sites/Finance/Invoices/Forms/AllItems.aspx?FilterField1=Title&FilterValue1=${formRenderProps.valueGetter('Title')}`}>{formRenderProps.valueGetter('Title')}</a></span>
                                                    </CardTitle>
                                                    <CardTitle>
                                                        <span title={`Sum of ${this.props.dataItem.Accounts ? this.props.dataItem.Accounts.length : 0} Accounts`}>
                                                            <span>Amount Assigned:</span> {this.props.dataItem.Accounts ? <span>{MyHelper.SumAccounts(this.props.dataItem.Accounts)}</span> : <span title='Loading Account Details...'>$---.--</span>}
                                                        </span>
                                                    </CardTitle>
                                                </div>
                                                <div className='col-xs-12 col-sm-4'>
                                                    <CardSubtitle style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                                                        <div title='Invoice Date' style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Date:</span><span><Moment date={formRenderProps.valueGetter('Invoice_x0020_Date')} format={'MM/DD/YYYY'} /></span>
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
                                        <div className='col-xs-2 col-sm-2'>
                                            <Button
                                                style={{ float: 'right' }}
                                                primary={true}
                                                look='flat'
                                                icon='edit'
                                                title='Edit Invoice'
                                                onClick={e => { console.log(e); e.preventDefault(); }}
                                            />
                                            {
                                                formRenderProps.modified &&
                                                <Button
                                                    style={{ float: 'right' }}
                                                    look='flat'
                                                    icon='cancel'
                                                    title='Cancel Changes'
                                                    onClick={formRenderProps.onFormReset}
                                                />
                                            }
                                        </div>
                                    </div>
                                </CardHeader>
                            </div>
                            {
                                this.state.showMore &&
                                <CardBody>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'OData__Status'}>Invoice Status:</Label>
                                                <Field name='OData__Status' component={DropDownList} data={this.props.invoiceStatus ? this.props.invoiceStatus : []} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Invoice_x0020_Type'}>Invoice Type:</Label>
                                                <Field name='Invoice_x0020_Type' component={DropDownList} data={this.props.invoiceTypes ? this.props.invoiceTypes : []} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label editorId={'Department'}>Departments:</Label>
                                                <Field name='Department' component={MultiSelect} textField='Title' dataItemKey='ID' data={this.props.departments ? [...this.props.departments] : []} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label>Requires Approval From:</Label>
                                                {item.Requires_x0020_Approval_x0020_From && item.Requires_x0020_Approval_x0020_From.sort((a, b) => a.Title < b.Title ? -1 : a.Title > b.Title ? 1 : 0).map(user => {
                                                    return <div>{user.Title}</div>;
                                                })}
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label>Received Approval From:</Label>
                                                {item.Received_x0020_Approval_x0020_From && item.Received_x0020_Approval_x0020_From.sort((a, b) => a.Title < b.Title ? -1 : a.Title > b.Title ? 1 : 0).map(user => {
                                                    return <div>{user.Title}</div>;
                                                })}
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Invoice_x0020_Number'}>Invoice Number:</Label>
                                                <Field name='Invoice_x0020_Number' component={Input} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'PO_x0020__x0023_'}>PO #:</Label>
                                                <Field name='PO_x0020__x0023_' component={Input} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Invoice_x0020_Date'}>Invoice Date:</Label>
                                                <Field name='Invoice_x0020_Date' component={DatePicker} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Received_x0020_Date'}>Received Date:</Label>
                                                <Field name='Received_x0020_Date' component={DatePicker} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Gross_x0020_Amount'}>Gross Amount:</Label>
                                                <Field name='Gross_x0020_Amount' component={NumericTextBox} format="c2" min={0} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Total_x0020_Tax_x0020_Amount'}>Total Tax Amount:</Label>
                                                <Field name='Total_x0020_Tax_x0020_Amount' component={NumericTextBox} format="c2" min={0} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-sm-12'>
                                            <FieldWrapper>
                                                <Label>Accounts:</Label>
                                                {
                                                    this.props.dataItem.Accounts ?
                                                        <FieldArray
                                                            name="Accounts"
                                                            component={AccountFieldComponent}
                                                            value={this.props.dataItem.Accounts}
                                                        /> :
                                                        <Spinner size={SpinnerSize.medium} />
                                                }
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-sm-12'>
                                            <FieldWrapper>
                                                <Label>Approval Notes</Label>
                                                <Field name='ApprovalNotes' component={TextArea} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-sm-12'>
                                            <FieldWrapper>
                                                <Label>Deny Comment</Label>
                                                <Field name='DenyComment' component={TextArea} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-sm-12'>
                                            <FieldWrapper>
                                                <Label>Cheque Returned Notes</Label>
                                                <Field name='ChequeReturnedNotes' component={TextArea} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                </CardBody>
                            }
                        </Card>
                    </ FormElement>
                )}
            />
        );
    }
}