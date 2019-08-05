export default {
  state: '<%= name %>',
  reducers: {
    update(state) {
      return `${state}_<%= name %>`
    }
  },
  epic: {
    updateEpic: action$ => action$.ofType('update').pipe(mapTo('transform'))
  }
}
