"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TodoList } from "@/components/todo-list"
import { loadInvoices, loadPayments, saveInvoices, savePayments, loadApprovals, saveApprovals } from "@/lib/mock-data"
import type { TodoItem, Invoice, Payment, InvoiceApproval } from "@/lib/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function TodosPage() {
  const { user, isLoading } = useAuth()
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const { toast } = useToast()

  useEffect(() => {
    loadTodos()
  }, [user])

  const loadTodos = () => {
    if (!user) return

    const allInvoices = loadInvoices()
    const allPayments = loadPayments()
    setInvoices(allInvoices)
    setPayments(allPayments)

    const todoItems: TodoItem[] = []

    // 财务角色：待审批的发票
    if (user.role === "finance") {
      const pendingInvoices = allInvoices.filter((inv) => inv.status === "pending_approval")
      pendingInvoices.forEach((invoice) => {
        todoItems.push({
          id: `invoice-${invoice.id}`,
          type: "invoice_approval",
          title: `${invoice.invoiceNumber || invoice.id}`,
          description: `项目：${invoice.projectName}，客户：${invoice.customerName}，金额：¥${invoice.amount.toLocaleString()}`,
          relatedId: invoice.id,
          relatedData: invoice,
          priority: invoice.amount > 500000 ? "high" : "medium",
          status: "pending",
          processName: "发票审批流程",
          initiator: invoice.submittedBy,
          initiatorName: invoice.submittedByName,
          assignee: user.id,
          assigneeName: user.name,
          createdAt: invoice.createdAt,
        })
      })

      // 待确认的回款
      const pendingPayments = allPayments.filter((pay) => pay.status === "pending")
      pendingPayments.forEach((payment) => {
        const relatedInvoice = allInvoices.find((inv) => inv.id === payment.invoiceId)
        todoItems.push({
          id: `payment-${payment.id}`,
          type: "payment_confirmation",
          title: `${payment.invoiceNumber || payment.id}`,
          description: `金额：¥${payment.amount.toLocaleString()}，银行流水：${payment.bankReference || "无"}`,
          relatedId: payment.id,
          relatedData: payment,
          priority: "medium",
          status: "pending",
          processName: "回款确认流程",
          initiator: relatedInvoice?.submittedBy || "unknown",
          initiatorName: relatedInvoice?.submittedByName || "未知",
          assignee: user.id,
          assigneeName: user.name,
          createdAt: payment.createdAt,
        })
      })
    }

    // 客户经理：被拒绝的发票需要重新处理
    if (user.role === "customer_manager") {
      const rejectedInvoices = allInvoices.filter(
        (inv) => inv.status === "rejected" && inv.submittedBy === user.id
      )
      rejectedInvoices.forEach((invoice) => {
        todoItems.push({
          id: `invoice-${invoice.id}`,
          type: "invoice_approval",
          title: `${invoice.invoiceNumber || invoice.id}`,
          description: `项目：${invoice.projectName}，需要修改后重新提交`,
          relatedId: invoice.id,
          relatedData: invoice,
          priority: "high",
          status: "rejected",
          processName: "发票审批流程",
          initiator: invoice.submittedBy,
          initiatorName: invoice.submittedByName,
          assignee: user.id,
          assigneeName: user.name,
          createdAt: invoice.updatedAt,
        })
      })
    }

    // 按优先级和时间排序
    todoItems.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority]
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    setTodos(todoItems)
  }

  const handleApproveInvoice = (invoiceId: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (!invoice || !user) return

    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, status: "approved" as const, updatedAt: new Date().toISOString() } : inv
    )
    saveInvoices(updatedInvoices)

    const approvals = loadApprovals()
    const newApproval: InvoiceApproval = {
      id: `approval-${Date.now()}`,
      invoiceId,
      approverId: user.id,
      approverName: user.name,
      action: "approved",
      createdAt: new Date().toISOString(),
    }
    saveApprovals([...approvals, newApproval])

    toast({
      title: "审批成功",
      description: `发票 ${invoice.invoiceNumber || invoice.id} 已批准`,
    })

    loadTodos()
  }

  const handleRejectInvoice = (invoiceId: string, notes: string) => {
    const invoice = invoices.find((inv) => inv.id === invoiceId)
    if (!invoice || !user) return

    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId
        ? { ...inv, status: "rejected" as const, notes, updatedAt: new Date().toISOString() }
        : inv
    )
    saveInvoices(updatedInvoices)

    const approvals = loadApprovals()
    const newApproval: InvoiceApproval = {
      id: `approval-${Date.now()}`,
      invoiceId,
      approverId: user.id,
      approverName: user.name,
      action: "rejected",
      notes,
      createdAt: new Date().toISOString(),
    }
    saveApprovals([...approvals, newApproval])

    toast({
      title: "已拒绝",
      description: `发票 ${invoice.invoiceNumber} 已被拒绝`,
      variant: "destructive",
    })

    loadTodos()
  }

  const handleConfirmPayment = (paymentId: string) => {
    const payment = payments.find((pay) => pay.id === paymentId)
    if (!payment || !user) return

    const updatedPayments = payments.map((pay) =>
      pay.id === paymentId
        ? { ...pay, status: "confirmed" as const, confirmedBy: user.id }
        : pay
    )
    savePayments(updatedPayments)

    toast({
      title: "确认成功",
      description: `回款 ¥${payment.amount.toLocaleString()} 已确认`,
    })

    loadTodos()
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const invoiceApprovals = todos.filter((t) => t.type === "invoice_approval")
  const paymentConfirmations = todos.filter((t) => t.type === "payment_confirmation")

  return (
    <DashboardLayout>
      <div className="h-full flex flex-col">
        {/* 标签页导航 */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center gap-6 px-6 h-12">
            <button className="text-sm text-gray-600 hover:text-[#1890ff] pb-3 border-b-2 border-transparent hover:border-[#1890ff]">
              首页
            </button>
            <button className="text-sm text-gray-600 hover:text-[#1890ff] pb-3 border-b-2 border-transparent hover:border-[#1890ff]">
              发票管理
            </button>
            <button className="text-sm text-[#1890ff] pb-3 border-b-2 border-[#1890ff] font-medium">
              我的待办
            </button>
            <button className="text-sm text-gray-600 hover:text-[#1890ff] pb-3 border-b-2 border-transparent hover:border-[#1890ff]">
              制约情况
            </button>
            <button className="text-sm text-gray-600 hover:text-[#1890ff] pb-3 border-b-2 border-transparent hover:border-[#1890ff]">
              用户管理
            </button>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800">我的待办</h2>
            <p className="text-sm text-gray-600 mt-1">
              共 {todos.length} 项待办事项
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-white border border-gray-200 p-1">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#1890ff] data-[state=active]:text-white">
                全部
                {todos.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700">
                    {todos.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="invoice" className="data-[state=active]:bg-[#1890ff] data-[state=active]:text-white">
                发票审批
                {invoiceApprovals.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700">
                    {invoiceApprovals.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payment" className="data-[state=active]:bg-[#1890ff] data-[state=active]:text-white">
                回款确认
                {paymentConfirmations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-700">
                    {paymentConfirmations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <TodoList
                todos={todos}
                onApproveInvoice={handleApproveInvoice}
                onRejectInvoice={handleRejectInvoice}
                onConfirmPayment={handleConfirmPayment}
                userRole={user.role}
              />
            </TabsContent>

            <TabsContent value="invoice" className="mt-6">
              <TodoList
                todos={invoiceApprovals}
                onApproveInvoice={handleApproveInvoice}
                onRejectInvoice={handleRejectInvoice}
                onConfirmPayment={handleConfirmPayment}
                userRole={user.role}
              />
            </TabsContent>

            <TabsContent value="payment" className="mt-6">
              <TodoList
                todos={paymentConfirmations}
                onApproveInvoice={handleApproveInvoice}
                onRejectInvoice={handleRejectInvoice}
                onConfirmPayment={handleConfirmPayment}
                userRole={user.role}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </DashboardLayout>
  )
}
