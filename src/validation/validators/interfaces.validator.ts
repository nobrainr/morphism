export interface TypeValidator<ValueType, SymbolType extends symbol> {
  type: SymbolType;
  validateAndParse: (value: any) => ValueType;
}
