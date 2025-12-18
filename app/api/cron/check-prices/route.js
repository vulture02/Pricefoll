import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Cron job to check prices executed successfully.",
  })
}

export async function POST(request) {
  try{
    const authHeader=request.headers.get("authorization");
    const cronSecret=process.env.CRON_SECRET;
    if(!cronSecret || authHeader!==`Bearer ${cronSecret}`){
      return NextResponse.json({message:"Unauthorized"}, {status:401});
    }

  }catch(error){
    console.error("Error in cron job:", error);
  }
}
