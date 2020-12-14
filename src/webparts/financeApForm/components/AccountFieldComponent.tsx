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
import { Button, Chip } from '@progress/kendo-react-buttons';
import { Form, Field, FormElement, FieldWrapper, FieldArray } from '@progress/kendo-react-form';
import { Label, Error } from '@progress/kendo-react-labels';
import { Input, MaskedTextBox, NumericTextBox, TextArea } from '@progress/kendo-react-inputs';
import { DropDownList, MultiSelect } from '@progress/kendo-react-dropdowns';
import { DatePicker } from '@progress/kendo-react-dateinputs';
import { Grid, GridColumn, GridToolbar } from '@progress/kendo-react-grid';
import { IInvoice } from '../interfaces/IInvoice';

// Fluent UI Imports
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';

//#region Validators
const _GLValidator = value => (value && !value.includes('_') && value.length === 21) ? "" : "Please Enter a valid GL Acount Code.";
const _AmountValidator = value => (value && value !== 0) ? "" : "Amount cannot be $0.00";
//#endregion

//#region Input Field Render Methods
const glCodeInput = fieldRenderProps => {
    const { validationMessage, visited, ...others } = fieldRenderProps;
    return <div style={{ minHeight: '43px' }}>
        <MaskedTextBox {...others} mask="000-00-000-00000-0000" />
        {
            validationMessage &&
            (<Error>{validationMessage}</Error>)
        }
    </div>;
};

const amountInput = fieldRenderProps => {
    const { validationMessage, visited, ...others } = fieldRenderProps;
    return <div style={{ minHeight: '43px' }}>
        <NumericTextBox {...others} format="c2" />
        {
            validationMessage &&
            (<Error>{validationMessage}</Error>)
        }
    </div>;
};
//#endregion

//#region Cell Render Methods
const glCodeCell = props => {
    return (
        <td>
            <Field component={glCodeInput}
                name={`Accounts[${props.dataIndex}].${props.field}`}
                defaultValue={props.dataItem.Title}
                validator={_GLValidator}
            />
        </td>
    );
};

const amountCell = props => {
    return (
        <td>
            <Field
                component={amountInput}
                name={`Accounts[${props.dataIndex}].${props.field}`}
                defaultValue={props.dataItem.AmountIncludingTaxes}
                validator={_AmountValidator}
            />
        </td>
    );
};

const commandCell = (onRemove) => (props) => {
    const onClick = React.useCallback(
        (e) => {
            e.preventDefault();
            onRemove(props);
        },
        [onRemove]
    );
    return (
        <td>
            <Button
                className="k-button k-grid-remove-command"
                icon='trash'
                title='Delete Account'
                onClick={onClick}
            />
        </td>
    );
};
//#endregion

/**
 * Renders the Accounts Grid.
 * @param fieldArrayRenderProps Props from form
 */
export const AccountFieldComponent = (fieldArrayRenderProps) => {
    const onAdd = React.useCallback(
        (e) => {
            e.preventDefault();
            fieldArrayRenderProps.onUnshift({ value: { Title: '', AmountIncludingTaxes: 0 } });
        },
        [fieldArrayRenderProps.onUnshift]
    );

    const onRemove = React.useCallback(
        (cellProps) => fieldArrayRenderProps.onRemove({ index: cellProps.dataIndex }),
        [fieldArrayRenderProps.onRemove]
    );

    return (
        <div>
            {
                fieldArrayRenderProps.visited && fieldArrayRenderProps.validationMessage &&
                (<Error>{fieldArrayRenderProps.validationMessage}</Error>)
            }
            <Grid data={fieldArrayRenderProps.value}>
                <GridToolbar>
                    <Button title="Add new" icon='plus' primary={true} look='flat' onClick={onAdd} >Add Account</Button>
                </GridToolbar>
                <GridColumn field="Title" title="Account Code" cell={glCodeCell} />
                <GridColumn field="AmountIncludingTaxes" title={`Amount Including Taxes (${MyHelper.SumAccounts(fieldArrayRenderProps.value)})`} cell={amountCell} />
                <GridColumn cell={commandCell(onRemove)} width="240px" />

            </Grid>
        </div>
    );
};