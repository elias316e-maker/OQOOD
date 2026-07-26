"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createContractMilestoneAction, updateContractMilestoneAction } from "../actions";
import styles from "./contract-execution.module.css";

type Milestone = {
  id:string;number:number;title:string;description:string|null;dueDate:string|null;
  amount:string;progress:number;status:string;paymentStatus:string;rejectionReason:string|null;
};

export function ContractExecution({contractId,currency,milestones,canUpdate,canApprove}:{
  contractId:string;currency:string;milestones:Milestone[];canUpdate:boolean;canApprove:boolean;
}) {
  const router=useRouter(); const [pending,startTransition]=useTransition();
  const [feedback,setFeedback]=useState<{tone:string;message:string}|null>(null);
  const [progress,setProgress]=useState<Record<string,string>>({});
  const [reason,setReason]=useState<Record<string,string>>({});
  const money=(v:string)=>new Intl.NumberFormat("ar-SA",{style:"currency",currency}).format(Number(v));
  const run=(milestoneId:string,command:"START"|"PROGRESS"|"SUBMIT"|"ACCEPT"|"REJECT"|"CLAIM"|"PAY")=>
    startTransition(async()=>{
      const result=await updateContractMilestoneAction({contractId,milestoneId,command,progress:Number(progress[milestoneId]),reason:reason[milestoneId]});
      setFeedback({tone:result.success?"success":"error",message:result.message}); if(result.success)router.refresh();
    });
  return <div className={styles.wrapper}>
    {canUpdate&&<form action={(fd)=>startTransition(async()=>{
      const result=await createContractMilestoneAction({contractId,title:String(fd.get("title")??""),description:String(fd.get("description")??""),dueDate:String(fd.get("dueDate")??""),amount:String(fd.get("amount")??"")});
      setFeedback({tone:result.success?"success":"error",message:result.message});if(result.success)router.refresh();
    })} className={styles.form}>
      <h3>إضافة مرحلة تنفيذ</h3><input name="title" placeholder="اسم المرحلة أو التسليم" required/>
      <input name="dueDate" type="date"/><input min="0" name="amount" placeholder="قيمة المرحلة" step=".01" type="number"/>
      <textarea name="description" placeholder="وصف التسليم" rows={2}/><button disabled={pending}>إضافة المرحلة</button>
    </form>}
    {feedback&&<p className={styles.feedback} data-tone={feedback.tone}>{feedback.message}</p>}
    <div className={styles.cards}>{milestones.map(m=><article key={m.id}>
      <header><div><span>المرحلة {m.number}</span><strong>{m.title}</strong></div><b>{m.status}</b></header>
      <p>{m.description??"—"}</p><div className={styles.progress}><i style={{width:`${m.progress}%`}}/><span>{m.progress}%</span></div>
      <dl><div><dt>القيمة</dt><dd>{money(m.amount)}</dd></div><div><dt>الاستحقاق</dt><dd>{m.dueDate?new Intl.DateTimeFormat("ar-SA").format(new Date(m.dueDate)):"غير محدد"}</dd></div><div><dt>الدفع</dt><dd>{m.paymentStatus}</dd></div></dl>
      <footer>
        {canUpdate&&m.status==="PLANNED"&&<button onClick={()=>run(m.id,"START")}>بدء</button>}
        {canUpdate&&m.status==="IN_PROGRESS"&&<><input max="100" min="0" onChange={e=>setProgress({...progress,[m.id]:e.target.value})} placeholder="نسبة %" type="number"/><button onClick={()=>run(m.id,"PROGRESS")}>تحديث</button>{m.progress===100&&<button onClick={()=>run(m.id,"SUBMIT")}>تقديم التسليم</button>}</>}
        {canApprove&&m.status==="SUBMITTED"&&<><button onClick={()=>run(m.id,"ACCEPT")}>قبول</button><input onChange={e=>setReason({...reason,[m.id]:e.target.value})} placeholder="سبب الرفض"/><button data-danger onClick={()=>run(m.id,"REJECT")}>رفض</button></>}
        {canUpdate&&m.status==="ACCEPTED"&&m.paymentStatus==="NOT_CLAIMED"&&<button onClick={()=>run(m.id,"CLAIM")}>تسجيل مطالبة</button>}
        {canUpdate&&m.paymentStatus==="CLAIMED"&&<button onClick={()=>run(m.id,"PAY")}>تسجيل السداد</button>}
      </footer>{m.rejectionReason&&<small>آخر ملاحظة: {m.rejectionReason}</small>}
    </article>)}</div>
  </div>;
}
