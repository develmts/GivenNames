// Versio 5.0
// Singleton Logger
// Added child(tag) factory for tagged loggers

import { AppConfig } from "@/config.js";

export default class Logger {
  private static instance : Logger | undefined = undefined
  private verbose = false;
  private scope?: string;
  private constructor(){}
  
  private applyConfig(cfg: AppConfig) {
    this.verbose = !!cfg.verbose;
  }
  
  static init(cfg:AppConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();      
    }
    Logger.instance.applyConfig(cfg);    
    return Logger.instance;
  }

  static get(): Logger {
    if (!Logger.instance) {
      // ⚠️ Fallback silenciós → logger amb verbose=false
      Logger.instance = new Logger();
      //throw new Error("Logger not initialized. Call LoggerClass.init(config) first.");
    }
    return Logger.instance;
  }

  private prefix(level: string, tag?:string): string {
    const ts = new Date().toISOString();
    if (tag) {
      return `[${ts}] [${tag}] [${level}]`;
    }

    // try to find caller
    const err = new Error();
    const stack = err.stack?.split("\n")[3] ?? ""; // caller line
    const match = stack.match(/at (.+?) \((.+?):(\d+):\d+\)/) || stack.match(/at (.+?):(\d+):\d+/);

    let caller = "unknown";
    if (match) {
      // match[1] could be function or path
      const raw = match[1];
      // if path, only last segment
      caller = raw.split(/[\\/]/).pop() ?? raw;
    }

    return `[${ts}] [${caller}] [${level}]`;
  }

  // change loglevel after initialization
  setVerbose(v: boolean) { this.verbose = v;}

  info(msg: string) {
    console.log(this.prefix("INFO"), msg);
  }

  warn(msg: string) {
    console.warn(this.prefix("WARN"), msg);
  }

  error(msg: string, err?: any) {
    console.error(this.prefix("ERROR"), msg);
    if (err && this.verbose) console.error(err);
  }

  debug(msg: string) {
    if (this.verbose) console.debug(this.prefix("DEBUG"), msg);
  }

  // Factory for tagged loggers
  child(tag: string) {
    const base = this;
    const cleanTag = tag.trim();

    return {
      info: (msg: string) => console.log(base.prefix("INFO", cleanTag), msg),
      warn: (msg: string) => console.warn(base.prefix("WARN", cleanTag), msg),
      error: (msg: string, err?: any) => {
        console.error(base.prefix("ERROR", cleanTag), msg);
        if (err && base.verbose) console.error(err);
      },
      debug: (msg: string) => {
        if (base.verbose) console.debug(base.prefix("DEBUG", cleanTag), msg);
      }
    };
  }
}