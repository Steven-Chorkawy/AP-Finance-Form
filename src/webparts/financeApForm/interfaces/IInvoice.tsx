interface ISPUser {
    Id: number;
    EMail: string;
    Title: string;
}


export interface IInvoice {
    ID: number;
    Id: number;
    ContentTypeId: string;
    Title: string;
    OData__Status: string;
    Vendor_x0020_Number: string;
    Vendor_x0020_Name: string;
    Invoice_x0020_Number: string;
    Invoice_x0020_Date: Date;
    Received_x0020_Date: Date;
    Gross_x0020_Amount: number;
    Total_x0020_Tax_x0020_Amount: number;
    PO_x0020__x0023_: any; // TODO: What type is this? 
    Close: string;
    Purchasing: string;
    Adds_x0020_OK: string;
    Prices_x0020_OK: string;
    ChequeType: string;
    Batch_x0020_Number: string;
    Entered: string;
    Voucher_x0020_Number: string;
    Cheque_x0020_Number: any;
    DepartmentId: any;
    HiddenDepartmentId: any;
    Department: any;
    Invoice_x0020_Type: string;

    Requires_x0020_Approval_x0020_FromId: number[];
    Requires_x0020_Approval_x0020_FromStringId: any;
    Requires_x0020_Approval_x0020_From: ISPUser[];

    Received_x0020_Approval_x0020_FromId: number[];
    Received_x0020_Approval_x0020_From: ISPUser[];
    Received_x0020_Approval_x0020_FromStringId: any;

    SharedWithUsersId: number[];
    DenyComment: string;

    Accounts?: any[];


    // TODO: Get the ID version of this.
    //Received_x0020_Deny_x0020_From_x0020_String
    ApprovalNotes: string;
    DocumentSetDescription: string;
    ChequeReturnedNotes: any;
    Modified: string;
    Created: string;
    IsChequeReq: boolean;
    ZeroDollarPayment: boolean;
    GUID: string;
    saveSuccess?: boolean;  // indicates if this record was successfully saved or not.
}

