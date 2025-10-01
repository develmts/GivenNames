// src/services/ApiService/middleware/errorHandler.ts

// export const errorHandler = async (c: any, next: any) => {
//   try {
//     await next()
//   } catch (err: any) {
//     log.error("Unhandled error in request", err)
//     return c.json(
//       {
//         error: "Internal Server Error",
//         message: err?.message || "Unexpected error"
//       },
//       500
//     )
//   }
// }


import { Context, Next } from "hono"
import { AppException, HTTPException, InternalServerErrorException } from "@/exceptions"
import Logger from "@/utils/logger"

const log = Logger.get().child("error")

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (err) {
    //log.error("Unhandled error in request", err)
    if (err instanceof HTTPException) {
      err = err as HTTPException
      // return c.json({ 
      //   error: err.message, 
      //   details: err.details || null
      // }, 
      // err.status)
      return c.json(err.toJSON(),err.status)
    }

    if (err instanceof AppException) {
      // Map generic AppException → 500
      err = err as AppException
      const e = new InternalServerErrorException(err.message, err.details)
      // return c.json({ 
      //   error: e.message, 
      //   details: e.details }, 
      //   500,
      //   //e.status as ContentfulStatusCode
      // )
      return c.json(e.toJSON(),500)
    }
    // Unknown errors
    console.error("[unhandled Error]",err)
    const e = new InternalServerErrorException(err.message, err.details)

    return c.json(e.toJSON(), 500)
  }
}
