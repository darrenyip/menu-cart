let xlsxPromise

export function loadXLSX() {
  if (!xlsxPromise) {
    xlsxPromise = import('xlsx').then((module) => module.default ?? module)
  }
  return xlsxPromise
}

