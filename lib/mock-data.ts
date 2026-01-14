import type { User, Project, Invoice, Payment, InvoiceApproval } from "./types"

// 模拟用户数据
export const mockUsers: User[] = [
  { id: "1", email: "manager1@company.com", name: "张经理", role: "customer_manager" },
  { id: "2", email: "manager2@company.com", name: "李经理", role: "customer_manager" },
  { id: "3", email: "finance@company.com", name: "王财务", role: "finance" },
  { id: "4", email: "support@company.com", name: "赵支持", role: "business_support" },
]

// 模拟项目数据
export const mockProjects: Project[] = [
  { id: "p1", name: "项目A", customerName: "ABC公司", managerId: "1", status: "active", createdAt: "2024-01-01" },
  { id: "p2", name: "项目B", customerName: "XYZ集团", managerId: "1", status: "active", createdAt: "2024-01-15" },
  { id: "p3", name: "项目C", customerName: "测试企业", managerId: "2", status: "active", createdAt: "2024-02-01" },
]

// 从localStorage加载数据或使用默认数据
export function loadInvoices(): Invoice[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("invoices")
  if (stored) {
    const invoices = JSON.parse(stored)
    // Migrate old invoices with pending_upload status to approved
    const migrated = invoices.map((inv: any) => {
      if (inv.status === "pending_upload") {
        return { ...inv, status: "approved" as const }
      }
      return inv
    })
    // Save the migrated data
    if (JSON.stringify(invoices) !== JSON.stringify(migrated)) {
      localStorage.setItem("invoices", JSON.stringify(migrated))
    }
    return migrated
  }
  const defaultInvoices: Invoice[] = [
    {
      id: "inv1",
      projectId: "p1",
      projectName: "项目A",
      customerName: "ABC公司",
      invoiceNumber: "INV-2024-001",
      amount: 500000,
      status: "pending_approval",
      submittedBy: "1",
      submittedByName: "张经理",
      notes: "第一期款项",
      createdAt: "2024-03-01T10:00:00Z",
      updatedAt: "2024-03-01T10:00:00Z",
      // 详细信息
      applicant: "张经理",
      applicationType: "normal",
      contractCode: "CT-2024-001",
      contractName: "ABC公司软件开发合同",
      projectCode: "PRJ-2024-001",
      contractRevenue: 1000000,
      appliedInvoiceAmount: 0,
      mainRevenue: 500000,
      industryType: "软件和信息技术服务业",
      taxpayerIdNumber: "91110000MA01234567",
      isRevenueListed: true,
      invoiceNotes: "请按合同约定开具增值税专用发票",
      invoiceItems: [
        {
          id: "item1",
          invoiceType: "增值税专用发票",
          serviceEquipmentType: "软件开发服务",
          taxRate: 0.06,
          amountWithoutTax: 471698.11,
          taxAmount: 28301.89,
          amount: 500000,
        },
      ],
    },
    {
      id: "inv2",
      projectId: "p2",
      projectName: "项目B",
      customerName: "XYZ集团",
      invoiceNumber: "INV-2024-002",
      amount: 300000,
      status: "submitted_to_customer",
      submittedBy: "1",
      submittedByName: "张经理",
      notes: "项目启动费用",
      createdAt: "2024-02-15T14:30:00Z",
      updatedAt: "2024-02-20T09:15:00Z",
      // 详细信息
      applicant: "张经理",
      applicationType: "normal",
      contractCode: "CT-2024-002",
      contractName: "XYZ集团系统集成项目",
      projectCode: "PRJ-2024-002",
      contractRevenue: 800000,
      appliedInvoiceAmount: 0,
      mainRevenue: 300000,
      industryType: "信息系统集成服务",
      taxpayerIdNumber: "91110000MA98765432",
      isRevenueListed: false,
      invoiceItems: [
        {
          id: "item2",
          invoiceType: "增值税专用发票",
          serviceEquipmentType: "系统集成服务",
          taxRate: 0.06,
          amountWithoutTax: 283018.87,
          taxAmount: 16981.13,
          amount: 300000,
        },
      ],
    },
    {
      id: "inv3",
      projectId: "p3",
      projectName: "项目C",
      customerName: "测试企业",
      invoiceNumber: "INV-2024-003",
      amount: 800000,
      status: "pending_approval",
      submittedBy: "2",
      submittedByName: "李经理",
      notes: "项目尾款",
      createdAt: "2024-03-05T14:00:00Z",
      updatedAt: "2024-03-05T14:00:00Z",
      // 详细信息
      applicant: "李经理",
      applicationType: "urgent",
      contractCode: "CT-2024-003",
      contractName: "测试企业数字化转型项目",
      projectCode: "PRJ-2024-003",
      contractRevenue: 1500000,
      appliedInvoiceAmount: 700000,
      mainRevenue: 800000,
      industryType: "信息技术咨询服务",
      taxpayerIdNumber: "91110000MA11223344",
      isRevenueListed: true,
      invoiceNotes: "紧急开票，请优先处理",
      invoiceItems: [
        {
          id: "item3-1",
          invoiceType: "增值税专用发票",
          serviceEquipmentType: "技术咨询服务",
          taxRate: 0.06,
          amountWithoutTax: 471698.11,
          taxAmount: 28301.89,
          amount: 500000,
        },
        {
          id: "item3-2",
          invoiceType: "增值税专用发票",
          serviceEquipmentType: "软件实施服务",
          taxRate: 0.06,
          amountWithoutTax: 283018.87,
          taxAmount: 16981.13,
          amount: 300000,
        },
      ],
    },
  ]
  localStorage.setItem("invoices", JSON.stringify(defaultInvoices))
  return defaultInvoices
}

export function saveInvoices(invoices: Invoice[]) {
  localStorage.setItem("invoices", JSON.stringify(invoices))
}

export function loadPayments(): Payment[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("payments")
  if (stored) {
    return JSON.parse(stored)
  }
  const defaultPayments: Payment[] = [
    {
      id: "pay1",
      invoiceId: "inv2",
      invoiceNumber: "INV-2024-002",
      amount: 300000,
      paymentDate: "2024-03-10",
      status: "pending",
      bankReference: "TXN202403100001",
      notes: "客户已付款，待确认",
      createdAt: "2024-03-10T16:00:00Z",
    },
    {
      id: "pay2",
      invoiceId: "inv2",
      invoiceNumber: "INV-2024-002",
      amount: 150000,
      paymentDate: "2024-03-12",
      status: "pending",
      bankReference: "TXN202403120002",
      notes: "第二笔回款",
      createdAt: "2024-03-12T10:00:00Z",
    },
  ]
  localStorage.setItem("payments", JSON.stringify(defaultPayments))
  return defaultPayments
}

export function savePayments(payments: Payment[]) {
  localStorage.setItem("payments", JSON.stringify(payments))
}

export function loadApprovals(): InvoiceApproval[] {
  if (typeof window === "undefined") return []
  const stored = localStorage.getItem("approvals")
  return stored ? JSON.parse(stored) : []
}

export function saveApprovals(approvals: InvoiceApproval[]) {
  localStorage.setItem("approvals", JSON.stringify(approvals))
}
