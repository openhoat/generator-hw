export type InstallSteps = {
  [key: string]: {
    title: string,
    process: () => number,
  },
}
