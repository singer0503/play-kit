// SSR check 用的 Node loader：把 .css import 轉成空物件，避免 tsx 嘗試執行 CSS
export function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.css')) {
    return {
      url: 'data:text/javascript,export%20default%20%7B%7D',
      format: 'module',
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
