import * as React from 'react';

// My Imports
import * as MyHelper from '../MyHelperMethods';
import { AccountFieldComponent } from './AccountFieldComponent';

// PnP imports. 
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/site-users/web";
import { PeoplePicker, PrincipalType } from "@pnp/spfx-controls-react/lib/PeoplePicker";

// Kendo Imports 
import { Card, CardTitle, CardHeader, CardBody, CardSubtitle } from '@progress/kendo-react-layout';
import { Button, Chip } from '@progress/kendo-react-buttons';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Label } from '@progress/kendo-react-labels';
import { Input, NumericTextBox, TextArea, Checkbox } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { IPersonaProps } from 'office-ui-fabric-react/lib/components/Persona/Persona.types';
import { MessageBar } from 'office-ui-fabric-react/lib/components/MessageBar/MessageBar';
import { MessageBarType } from 'office-ui-fabric-react/lib/components/MessageBar';
import Stack from 'office-ui-fabric-react/lib/components/Stack/Stack';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react';
import { minusIcon, plusIcon, cancelIcon, pencilIcon, saveIcon } from '@progress/kendo-svg-icons';

const formValidator = value => {
    let output = {};
    const VALIDATION_SUMMARY = 'Cannot save your changes.  Please review the form for any errors.';
    switch (value.OData__Status) {
        case 'Received':
        case 'Awaiting Approval':
        case 'VOID':
        case 'Cancelled':
        case 'On Hold':
            break;
        default:
            if (value.Accounts && value.Accounts.length === 0) {
                output = { VALIDATION_SUMMARY: VALIDATION_SUMMARY, Accounts: "Please add at least one account." };
            }
            break;
    }
    return output;
};

export class APItemComponent extends React.Component<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            item: this.props.dataItem,
            showMore: this.props.showMore,
            saveButtonDisabled: false,
            cancelButtonDisabled: false
        };
    }

    public componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.showMore !== this.props.showMore) {
            this.setState({ showMore: this.props.showMore });
        }

        if (prevProps.dataItem.ID !== this.props.dataItem.ID || prevProps.dataItem.Modified !== this.props.dataItem.Modified) {
            this.setState({
                item: this.props.dataItem,
                saveButtonDisabled: false,
                cancelButtonDisabled: false
            });
        }
    }

    public render() {
        let cardTitleTextAlignStyle = { display: 'inline-block', width: '110px' };

        return (
            <Form
                key={`${this.state.item.ID}-${this.props.dataItem.Modified}-${this.props.showMore}-${this.props.dataItem.Accounts ? this.props.dataItem.Accounts.length : 'n'}`}
                onSubmit={(values, event) => {
                    this.setState({ saveButtonDisabled: true, cancelButtonDisabled: true });
                    console.log('onSave value');
                    console.log(values);
                    this.props.onSave(values);
                }}
                initialValues={this.props.dataItem}
                validator={formValidator}
                render={formRenderProps => (
                    <FormElement style={{ marginTop: '0px' }}>
                        <Card style={{ marginBottom: '10px', marginLeft: '2px', marginRight: '2px', fontSize: '1.5rem', paddingTop: '0px' }}>
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
                                    <div className='col-xs-2 col-sm-2'>
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
                                    </div>
                                </div>
                                {
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
                                }
                            </CardHeader>
                            {
                                this.state.showMore &&
                                <CardBody>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Vendor_x0020_Name'}>Vendor Name:</Label>
                                                <Field name='Vendor_x0020_Name' component={Input} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Vendor_x0020_Number'}>Vendor ID:</Label>
                                                <Field name='Vendor_x0020_Number' component={Input} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label editorId={'OData__Status'}>Invoice Status:</Label>
                                                <Field name='OData__Status' component={DropDownList} data={this.props.invoiceStatus ? this.props.invoiceStatus : []} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label editorId={'Invoice_x0020_Type'}>Invoice Type:</Label>
                                                <Field name='Invoice_x0020_Type' component={DropDownList} data={this.props.invoiceTypes ? this.props.invoiceTypes : []} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label editorId={'Invoice_x0020_Number'}>Invoice Number:</Label>
                                                <Field name='Invoice_x0020_Number' component={Input} />
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
                                        <div className='col-xs-12 col-sm-4' key={JSON.stringify(this.state.item.Requires_x0020_Approval_x0020_From)}>
                                            <FieldWrapper>
                                                <Label>Requires Approval From:</Label>
                                                <Field
                                                    name='RequiresApprovalFrom'
                                                    context={this.props.context}
                                                    personSelectionLimit={10}
                                                    defaultSelectedUsers={this.state.item.Requires_x0020_Approval_x0020_From && this.state.item.Requires_x0020_Approval_x0020_From.map(user => user.EMail)}
                                                    principalTypes={[PrincipalType.User]}
                                                    resolveDelay={1000}
                                                    component={PeoplePicker}
                                                    onChange={(e: IPersonaProps[]) => {
                                                        MyHelper.GetUsersByLoginName(e).then(users => {
                                                            formRenderProps.onChange('Requires_x0020_Approval_x0020_FromId', { value: [...users.map(user => { return user.Id; })] });
                                                        });
                                                    }}
                                                />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Label>Received Approval From:</Label>
                                                <Field
                                                    name='ReceivedApprovalFrom'
                                                    context={this.props.context}
                                                    personSelectionLimit={10}
                                                    defaultSelectedUsers={this.state.item.Received_x0020_Approval_x0020_From ? this.state.item.Received_x0020_Approval_x0020_From.map(user => user.EMail) : []}
                                                    principalTypes={[PrincipalType.User]}
                                                    resolveDelay={1000}
                                                    component={PeoplePicker}
                                                    onChange={(e: IPersonaProps[]) => {
                                                        MyHelper.GetUsersByLoginName(e).then(users => {
                                                            formRenderProps.onChange('Received_x0020_Approval_x0020_FromId', { value: [...users.map(user => { return user.Id; })] });
                                                            /**
                                                             * 06/08/2021 Steven Chorkawy 
                                                             *  I find it strange that I need to set the state of Received_x0020_Approval_x0020_From 
                                                             *  but I do not need to set the state of Requires_x0020_Approval_x0020_From in order to prevent 
                                                             *  a deleted user from reappearing after a save event.  
                                                             */
                                                            this.setState({
                                                                item: {
                                                                    ...this.state.item, Received_x0020_Approval_x0020_From: [...users.map(user => {
                                                                        return { EMail: user.Email, Id: user.Id, Title: user.Title };
                                                                    })]
                                                                }
                                                            });
                                                        });
                                                    }}
                                                />
                                                {/* {this.state.item.Received_x0020_Approval_x0020_From && this.state.item.Received_x0020_Approval_x0020_From.sort((a, b) => a.Title < b.Title ? -1 : a.Title > b.Title ? 1 : 0).map(user => {
                                                    return <div>{user.Title}</div>;
                                                })} */}
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Field name='ZeroDollarPayment' component={Checkbox} label={'Zero Dollar Payment'} labelPlacement={'before'} />
                                            </FieldWrapper>
                                        </div>
                                        <div className='col-xs-12 col-sm-4'>
                                            <FieldWrapper>
                                                <Field name='IsChequeReq' component={Checkbox} label={'Cheque Req'} labelPlacement={'before'} />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-xs-12 col-sm-6'>
                                            <FieldWrapper>
                                                <Label editorId={'Batch_x0020_Number'}>Batch #:</Label>
                                                <Field name='Batch_x0020_Number' component={Input} />
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
                                                <FieldArray
                                                    name="Accounts"
                                                    component={AccountFieldComponent}
                                                    value={formRenderProps.valueGetter('Accounts')}
                                                    StrInvoiceFolder={formRenderProps.valueGetter('Title')} // Passing Title here cause I need it to create GL Account Codes and I do not want to have to query the title with in the AccountFieldComponent.
                                                />
                                            </FieldWrapper>
                                        </div>
                                    </div>
                                    <div className='row'>
                                        <div className='col-sm-12'>
                                            <FieldWrapper>
                                                <Label>Notes</Label>
                                                <Field name='DocumentSetDescription' component={TextArea} />
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