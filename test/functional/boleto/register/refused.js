import test from 'ava'
import { Promise, promisify } from 'bluebird'
import { mock, mockFunction, restoreFunction } from '../helpers'
import { normalizeHandler } from '../../../helpers/normalizer'
import * as boletoHandler from '../../../../src/resources/boleto'
import * as provider from '../../../../src/providers/bradesco'

const create = normalizeHandler(boletoHandler.create)

const register = promisify(boletoHandler.register)

test.before(() => {
  mockFunction(provider, 'register', () => Promise.resolve({ status: 'refused' }))
})

test.after(() => {
  restoreFunction(provider, 'register')
})

test('registers a boleto (provider refused)', async (t) => {
  const payload = {
    expiration_date: new Date(),
    amount: 2000,
    issuer: 'bradesco',
    instructions: 'Please do not accept after expiration_date',
    register: false,
    queue_url: 'http://yopa/queue/test'
  }

  const { body } = await create({
    body: payload
  })

  const boleto = await register({
    body: JSON.stringify({ boleto_id: body.id, sqsMessage: { ReceiptHandle: 'abc' } })
  }, {})

  t.is(boleto.status, 'refused')
})

test('try to register already refused boleto', async (t) => {
  const payload = mock

  const { body } = await create({
    body: payload
  })

  const boleto = await register({
    body: JSON.stringify({ boleto_id: body.id, sqsMessage: { ReceiptHandle: 'abc' } })
  }, {})

  t.is(boleto.status, 'refused')
})
