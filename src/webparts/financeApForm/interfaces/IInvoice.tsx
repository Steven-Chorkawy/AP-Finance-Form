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

/**
 * AP Invoice after is has been queried out of SharePoint.
 * 
 * Note: Please update 'any' properties to their correct type.
 */
export interface IAPInvoiceQueryItem {
    Adds_x0020_OK: any;
    ApprovalNotes: string;
    AuthorId: number;
    Batch_x0020_Number: any;
    ChequeReturnedNotes: any;
    ChequeType: string;
    Cheque_x0020_Number: any;
    Close: string;
    ContentTypeId: string;
    Created: string;
    DenyComment: string;
    DepartmentId: number[];
    DocumentSetDescription: string;
    EditorId: number;
    Gross_x0020_Amount: number;
    ID: number;
    Invoice_x0020_Date: string;
    Invoice_x0020_Number: string;
    Invoice_x0020_Type: string;
    IsChequeReq: boolean;
    Modified: string;
    OData__Status: string;
    PO_x0020__x0023_: string;   // PO #
    Prices_x0020_OK: any;
    Purchasing: string;
    Received_x0020_Date: string;
    Received_x0020_Approval_x0020_From: string;
    Received_x0020_Approval_x0020_FromId: any;
    Requires_x0020_Approval_x0020_From: string;
    Requires_x0020_Approval_x0020_FromId: number[];
    Received_x0020_Deny_x0020_From_x0020_String: string;
    ScannedFileName: string;
    Title: string;
    Total_x0020_Tax_x0020_Amount: number;
    Vendor_x0020_Name: string;
    Vendor_x0020_Number: string;
    Voucher_x0020_Number: any;
    ZeroDollarPayment: boolean;

    Accounts?: any[];
}