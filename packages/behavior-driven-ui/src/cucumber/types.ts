type CucumberModule = typeof import('@cucumber/cucumber');

type SupportCodeLibraryBuilder = CucumberModule['supportCodeLibraryBuilder'];

type SupportCodeLibraryMethods = SupportCodeLibraryBuilder['methods'];

type Finalize = SupportCodeLibraryBuilder['finalize'];

type RawSupportLibrary = ReturnType<Finalize>;

type IsAny<T> = 0 extends 1 & T ? true : false;

type UnknownIfAny<T> = IsAny<T> extends true ? unknown : T;

export type ParallelAssignmentValidator = Parameters<
  SupportCodeLibraryMethods['setParallelCanAssign']
>[0];

export type SupportLibrary = Omit<RawSupportLibrary, 'World'> & {
  World: UnknownIfAny<RawSupportLibrary['World']>;
};

export type SupportCoordinates = SupportLibrary['originalCoordinates'];

export type ParameterTypeRegistry = SupportLibrary['parameterTypeRegistry'];

export type ParameterType = Exclude<
  ReturnType<ParameterTypeRegistry['lookupByTypeName']>,
  undefined
>;

export type ParameterTypeSource = ReturnType<
  ParameterTypeRegistry['lookupSource']
>;
