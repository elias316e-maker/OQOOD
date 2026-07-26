"use client";
import { useState,useTransition } from "react";
import { useRouter } from "next/navigation";
import { evaluateContractPartnerAction } from "../actions";
import styles from "./partner-evaluation.module.css";

export function PartnerEvaluation({contractId,evaluations,canEvaluate}:{contractId:string;canEvaluate:boolean;evaluations:Array<{id:string;overallScore:string;timelinessScore:number;qualityScore:number;responsivenessScore:number;financialScore:number;notes:string|null;createdAt:string;createdBy:string}>}){
 const router=useRouter();const[pending,startTransition]=useTransition();const[feedback,setFeedback]=useState<{tone:string;message:string}|null>(null);
 const fields=[["timelinessScore","الالتزام بالمواعيد"],["qualityScore","جودة التسليم"],["responsivenessScore","الاستجابة"],["financialScore","الأداء المالي"]] as const;
 return <div className={styles.wrapper}>{canEvaluate&&<form action={fd=>startTransition(async()=>{const r=await evaluateContractPartnerAction({contractId,timelinessScore:Number(fd.get("timelinessScore")),qualityScore:Number(fd.get("qualityScore")),responsivenessScore:Number(fd.get("responsivenessScore")),financialScore:Number(fd.get("financialScore")),notes:String(fd.get("notes")??"")});setFeedback({tone:r.success?"success":"error",message:r.message});if(r.success)router.refresh();})}>{fields.map(([name,label])=><label key={name}>{label}<select defaultValue="5" name={name}>{[5,4,3,2,1].map(v=><option key={v} value={v}>{v} / 5</option>)}</select></label>)}<label className={styles.wide}>ملاحظات<textarea name="notes" rows={2}/></label><button disabled={pending}>حفظ التقييم</button></form>}{feedback&&<p data-tone={feedback.tone}>{feedback.message}</p>}<div className={styles.history}>{evaluations.map(e=><article key={e.id}><strong>{Number(e.overallScore).toFixed(1)} / 5</strong><span>{e.createdBy} · {new Intl.DateTimeFormat("ar-SA").format(new Date(e.createdAt))}</span><small>المواعيد {e.timelinessScore} · الجودة {e.qualityScore} · الاستجابة {e.responsivenessScore} · المالي {e.financialScore}</small>{e.notes&&<p>{e.notes}</p>}</article>)}</div></div>;
}
