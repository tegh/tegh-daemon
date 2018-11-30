// import {
//   execute,
//   parse,
//   introspectionQuery,
//   GraphQLScalarType,
//   Kind,
// } from 'graphql'
// import { createSelector } from 'reselect'
// import { makeExecutableSchema } from 'graphql-tools'
// import GraphQLJSON from 'graphql-type-json'
//
// import configTypeDefs from '../internalValidationSchema.graphql'
//
// import {
//   CONTROLLER,
//   AXIS,
//   TOOLHEAD,
//   BUILD_PLATFORM,
//   FAN,
// } from '../types/components/ComponentTypeEnum'
//
// // const resolveStrictString = (value) => {
// //   // console.log('resolve ', value)
// //   if (typeof value !== 'string') throw new Error(`${value} is not a String`)
// //   return value
// // }
// //
// // const GraphQLStrictString = new GraphQLScalarType({
// //   name: 'String',
// //   description: 'Strict Strings with no conversion for numbers, etc.',
// //   serialize: resolveStrictString,
// //   parseValue: resolveStrictString,
// //   parseLiteral: ast => (
// //     ast.kind === Kind.STRING ? resolveStrictString(ast.value) : undefined
// //   ),
// // })
//
// const validationResolvers = {
//   Mutation: {
//     setMaterialConfig: setConfig('MATERIAL'),
//     setToolheadConfig: setConfig('COMPONENT'),
//     setTeghCoreConfig: setConfig('PLUGIN'),
//   },
//   ComponentConfig: {
//     __resolveType: (source) => {
//       switch (source.type) {
//         case CONTROLLER: return 'SerialControllerConfig'
//         case AXIS: return 'AxisConfig'
//         case TOOLHEAD: return 'ToolheadConfig'
//         case BUILD_PLATFORM: return 'BuildPlatformConfig'
//         case FAN: return 'FanConfig'
//         default: {
//           const message = (
//             `Invalid component type: ${source.type} (id: ${source.id})`
//           )
//           throw new Error(message)
//         }
//       }
//     },
//   },
//   JSON: GraphQLJSON,
//   // String: GraphQLStrictString,
// }
//
// const validationSchema = makeExecutableSchema({
//   typeDefs: configTypeDefs,
//   resolvers: validationResolvers,
// })
//
// const getConcreteType = type => (
//   type.ofType ? getConcreteType(type.ofType) : type
// )
//
// const getType = ({ types, name }) => (
//   types.find(type => type.name === name)
// )
//
// const buildAllFieldsQueryString = (options = {}) => {
//   const {
//     type,
//     types,
//     indent = '',
//     buildNestedFieldsQuery = () => '{ id }',
//   } = options
//
//   const { fields } = type
//   const fieldQueryStrings = fields.map((field) => {
//     const typeInField = getType({
//       types,
//       name: getConcreteType(field.type).name,
//     })
//     const argsString = ''
//     let nestedFieldsQuery = ''
//
//     // if (field.args != null) {
//     //   const args = Object.entries(field.args)
//     //     .map(([argKey, argValue]) => `${argKey}: ${argValue}`)
//     //
//     //   argsString = `(${args.join(', ')})`
//     // }
//
//     if (typeInField.kind === 'OBJECT') {
//       // console.log({field})
//       nestedFieldsQuery = buildNestedFieldsQuery({
//         ...options,
//         type: typeInField,
//         indent: `${indent}  `,
//       })
//       nestedFieldsQuery = ` ${nestedFieldsQuery.trim()}`
//     }
//     if (typeInField.kind === 'UNION') {
//       const unionedTypeQueries = typeInField.possibleTypes.map(({ name }) => {
//         const unionedType = getType({
//           types,
//           name,
//         })
//         const spreadIndent = `${indent}    `
//         const unionedTypeFieldsQuery = buildNestedFieldsQuery({
//           ...options,
//           type: unionedType,
//           indent: spreadIndent,
//         })
//         return (
//           `${spreadIndent}... on ${name} ${unionedTypeFieldsQuery.trim()}\n`
//         )
//       })
//       nestedFieldsQuery = `{\n${unionedTypeQueries.join('')}${indent}  }`
//     }
//
//     return `${indent}  ${field.name}${argsString}${nestedFieldsQuery}\n`
//   })
//
//   const allFieldsQuery = (
//     `${indent}{\n${
//       fieldQueryStrings.join('')
//     }${indent}}`
//   )
//
//   return allFieldsQuery
// }
//
//
// const buildFullQueryFromIntrospection = ({ introspection }) => {
//   if (introspection.errors != null) {
//     throw new Error(introspection.errors.map(error => error.message).join(','))
//   }
//   // eslint-disable-next-line no-underscore-dangle
//   const { types, queryType } = introspection.data.__schema
//   const queryTypeWithFields = types.find(t => t.name === queryType.name)
//
//   // console.log('start')
//   const query = buildAllFieldsQueryString({
//     type: queryTypeWithFields,
//     types,
//     buildNestedFieldsQuery: buildAllFieldsQueryString,
//   })
//   // console.log(query)
//   // throw new Error('done')
//   return query
// }
//
// const introspection = execute(
//   validationSchema,
//   parse(introspectionQuery),
// )
//
// const parsedValidationQuery = parse(
//   buildFullQueryFromIntrospection({
//     introspection,
//   }),
// )
//
// const validateCoreConfigShape = createSelector(
//   config => config,
//   (config) => {
//     const { errors } = execute(
//       validationSchema,
//       parsedValidationQuery,
//       config,
//     )
//     if (errors != null) {
//       const message = errors
//         .map(error => `${error.message} (at ${error.path.join('.')})`)
//         .join(',')
//       throw new Error(message)
//     }
//   },
// )
//
// export default validateCoreConfigShape
