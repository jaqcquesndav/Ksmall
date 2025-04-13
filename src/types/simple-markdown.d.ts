declare module 'simple-markdown' {
  export function blockRegex(regex: RegExp): any;
  export function inlineRegex(regex: RegExp): any;
  export function anyScopeRegex(regex: RegExp): any;
  export function parserFor(rules: any): (source: string, state?: any) => any;
  export function reactFor(output: any): (ast: any) => any;
  export function ruleOutput(rules: any): any;
  export const defaultRules: any;
  export const defaultBlockParse: any;
  export const defaultInlineParse: any;
  export const defaultOutput: any;
  export const defaultReactOutput: any;
  export function markdownToReact(source: string, options?: any): any;
  export function outputFor(rules: any, param: string): any;
}
