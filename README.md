# Simple Lit Store

## Usage

```typescript
class AppComponent extends LitElement {
   private router = new Router(this, [
      { path: "/", render: () => html`<x-home-component></x-home-component>` },
      { path: "/article/:id", render: ({ id }) => html`<div>value of id is ${id}</div>` }
   ])

   protected render(): unknown {
       return this.router.renderOutlet()
   }
}
```
