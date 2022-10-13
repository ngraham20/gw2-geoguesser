import { unstable_getServerSession } from 'next-auth/next'
import { ApiHandlers, CHALLENGE, WithDoc, Challenge as TChallenge } from '~/types'
import { authOptions } from '~/pages/api/auth/[...nextauth]'
import Game from '~/db/models/games'
import Challenge from '~/db/models/challenges'
import ChallengeOption from '~/db/models/challengeOption'
import User from '~/db/models/user'

const handlers: ApiHandlers = {
  game: {
    get: {
      one: async ({ id, sort, limit = 10 }) => {
        let challengeId = id
        let challenge: WithDoc<TChallenge> | undefined | null = undefined
        if (challengeId === 'daily' || challengeId === 'weekly' || challengeId === 'monthly') {
          challenge = await Challenge.findOne({ type: id }, { _id: 1, name: 1, type: 1, createdAt: 1 }).sort({
            createdAt: 'desc',
          })
          challengeId = challenge?._id
        }
        if (!challengeId) {
          throw new Error('Required challenge ID')
        }
        const filter = Game.find({ challenge: challengeId }).populate('userId', 'username')
        if (sort === 'score') {
          filter.sort({ totalScore: 'desc' })
        } else if (sort === 'time') {
          filter.sort({ createdAt: 'desc' })
        }
        const games = await filter.limit(limit).lean().exec()
        return { challenge, games }
      },
      many: async ({ req, res }) => {
        const session = await unstable_getServerSession(req, res, authOptions)
        if (!session) {
          throw new Error('Required session')
        }
        return Game.find({ userId: (session.user as any).id })
          .sort({ createdAt: 'desc' })
          .lean()
      },
    },
    post: {
      many: async ({ req, res, body }) => {
        const session = await unstable_getServerSession(req, res, authOptions)
        if (!session) {
          throw new Error('Required session')
        }
        const game = await Game.create({
          userId: (session.user as any).id,
          totalScore: body.totalScore,
          challenge: body.challenge,
          challengeType: body.challengeType,
        })
        return game as any
      },
    },
  },
  challenge: {
    get: {
      one: async ({ id }) => {
        console.info('[challenge]', { type: id })
        if (id === CHALLENGE.random) {
          return {
            options: await ChallengeOption.aggregate<{ _id: string }>([{ $sample: { size: 5 } }]),
          }
        } else if (id === CHALLENGE.daily || id === CHALLENGE.monthly || id === CHALLENGE.weekly) {
          return Challenge.findOne({ type: id }).sort({ createdAt: 'desc' }).populate('options')
        } else {
          return null
        }
      },
      many: async () => [],
    },
  },
  user: {
    get: {
      many: async ({ req, res }) => {
        const session = await unstable_getServerSession(req, res, authOptions)
        return session as any
      },
      one: async ({ id }) => {
        const user = await User.findOne({ username: id }, { _id: 1, username: 1, createdAt: 1 })
        if (!user) throw new Error('Not found')
        const userGames = await Game.find({ userId: user._id })
          .sort({ createdAt: 'desc' })
          .populate('challenge', 'name type createdAt')
        return {
          username: user.username,
          createdAt: user.createdAt,
          games: userGames,
        }
      },
    },
  },
}

export default handlers
