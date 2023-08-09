import {ReactiveController, LitElement, TemplateResult} from "lit";

interface Route {
   path: string,
   render: (params:any) => TemplateResult | undefined
}

interface Match {
   matches:Boolean,
   params?:any
}

const getParts = (url:string) =>
   url.split("/").filter(part => part)

export class Router implements ReactiveController {
   private readonly popstateEventListener

   constructor(
      private host:LitElement,
      private routes:Route[]
   ) {
      this.host.addController(this)
      this.popstateEventListener = () => this.host.requestUpdate()

      // order routes by priority for matching:
      // - path consisting of more parts is more specific and gets a higher priority
      // - static parts of a path result in higher priority than dynamic parts
      routes.sort((r1, r2) => {
         const r1parts = getParts(r1.path)
         const r2parts = getParts(r2.path)

         if (r1parts.length < r2parts.length) {
            return 1
         }

         if (r1parts.length > r2parts.length) {
            return -1
         }

         const tuples = r1parts.map((part, idx) => [part, r2parts[idx]])
         for (const tuple of tuples) {
            if (tuple[0].startsWith(":") && !tuple[1].startsWith(":")) {
               return 1
            }

            if (tuple[1].startsWith(":") && !tuple[0].startsWith(":")) {
               return -1
            }
         }

         return 0
      })
   }

   hostConnected() {
      window.addEventListener("popstate", this.popstateEventListener)
   }

   hostDisconnected() {
      window.removeEventListener("popstate", this.popstateEventListener)
   }

   private matches(pathname:string, pattern:string): Match {
      const pathnameParts = getParts(pathname)
      const patternParts = getParts(pattern)

      if (patternParts.length > pathnameParts.length) {
         return { matches: false }
      }

      const tuples = patternParts.map((value, idx) => [value, pathnameParts[idx]])
      const matches = tuples
         .filter(tuple => !tuple[0].startsWith(":")) // ignore dynamic parts
         .find(tuple => tuple[0] != tuple[1]) === undefined;

      if (!matches) {
         return { matches: false }
      }

      // extract parameters from pathname
      const params = tuples
         .filter(tuple => tuple[0].startsWith(":"))
         .reduce((acc:any, tuple) => {
            const name = tuple[0].substring(1)
            acc[name] = tuple[1]

            return acc
         }, {})

      return { matches, params }
   }

   /**
    * render content based on configured routes.
    */
   renderOutlet() {
      const pathname = window.location.pathname

      for (const r of this.routes) {
         const match = this.matches(pathname, r.path)
         if (match.matches) {
            return r.render(match.params)
         }
      }
   }

   /**
    * usage: <a href="/example" @click="${Router.navigateEventHandler}">here</a>
    */
   static navigateEventHandler(e:Event) {
      e.preventDefault()

      const element = e.currentTarget as HTMLLinkElement
      Router.navigate(element.href)
   }

   /**
    * navigate to {@param pathname} programmatically.
    */
   static navigate(pathname:string) {
      window.history.pushState({}, "", pathname)
      window.dispatchEvent(new Event('popstate'));
   }
}
