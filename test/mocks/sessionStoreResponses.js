export const lowSession = {
  assuranceLevel: 'low',
  authenticationMethod: 'astad.aprofiel.v1',
  lastLogin: '2020-02-27T09:32:53.540Z',
  name: 'Joske Vermeulen',
  user: 'Jos.verm',
};

export const substantialSession = {
  assuranceLevel: 'substantial',
  authenticationMethod: 'fas-citizen-bmid',
  lastLogin: '2020-02-27T09:35:34.371Z',
  name: 'Joske Vermeulen',
  user: 'Jos.verm',
};

export const highSession = {
  assuranceLevel: 'high',
  authenticationMethod: 'fas-citizen-eid',
  lastLogin: '2020-02-27T09:35:34.371Z',
  name: 'Joske Vermeulen',
  user: 'Jos.verm',
};

export const emptySessions = {
  sessions: [],
};

export const onlyLowSession = {
  sessions: [
    lowSession,
  ],
};

export const lowSubstantialSessions = {
  sessions: [
    lowSession,
    substantialSession,
  ],
};

export const lowSubstantialHighSessions = {
  sessions: [
    lowSession,
    substantialSession,
    highSession,
  ],
};

export const lowHighSessions = {
  sessions: [
    lowSession,
    highSession,
  ],
};
