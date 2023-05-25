import { RequestWithContext } from "../../../src/types/RequestWithContext";
import { mockedContext } from "../../test-helpers";
import { AuthorizeController } from "../../../src/routes/tsoa/authorize";
import { AuthorizationResponseType } from "../../../src/types";

describe("authorize", () => {
    describe("silent authentication", () => {
        it("should return an iframe document with a new code", async () => {

            // https://auth2.sesamy.dev/authorize
            //     ? client_id = VQy2yYCA9rIBJerZrUN0T
            //     & scope=openid+profile+email
            //     & redirect_uri=http://localhost:3000
            //     & prompt=none
            //     & response_type=code
            //     & response_mode=web_message
            //     & state=state
            //     & nonce=cUdmMWo1eFgubzdjMU9xSmhiS0pYdmpJME1GbFpJcllyWnBTU1FnWXQzTA % 3D % 3D 
            //     & code_challenge=CA6jwqDHtqZIzs9dcmTNBavFDQHPkfuBIO2Q8XRvWGA
            //     & code_challenge_method=S256
            //     & auth0Client=eyJuYW1lIjoiYXV0aDAtcmVhY3QiLCJ2ZXJzaW9uIjoiMi4xLjAifQ % 3D % 3D
            const controller = new AuthorizeController();

            const logs = [];

            const ctx = mockedContext({
                stateData: {
                    // This id corresponds to the base64 token below
                    'c20e9b02adc8f69944f036aeff415335c63ede250696a606ae73c5d4db016217': JSON.stringify({
                        "userId": "tenantId|test@example.com", "authParams":
                        {
                            "redirect_uri": "http://localhost:3000",
                            "scope": "openid profile email",
                            "state": "Rk1BbzJYSEFEVU9fTGd4cGdidGh0OHJnRHIwWTFrWFdOYlNySDMuU3YxMw==",
                            "client_id": "clientId",
                            "nonce": "Y0QuU09HRDB3TGszTX41QmlvM1BVTWRSWDA0WFpJdkZoMUwtNmJqYlFDdg==",
                            "response_type": "code"
                        }
                    })
                },
                logs,
            });

            ctx.headers.set('cookie', 'auth-token=wg6bAq3I9plE8Dau_0FTNcY-3iUGlqYGrnPF1NsBYhc')

            const actual = await controller.authorize(
                {
                    ctx,
                } as RequestWithContext,
                'clientId',
                AuthorizationResponseType.CODE,
                'http://localhost:3000',
                'openid+profile+email',
                'state',
                'none',
                'web_message',
            );

            // Should return something containing this
            // type: "authorization_response",
            // response: {"code":"-o5wLPh_YNZjbEV8vGM3VWcqdoFW34p30l5xI0Zm5JUd1","state":"a2sucn51bzd5emhiZVFWWGVjRlRqWFRFNk44LkhOfjZZbzFwa2k2WXdtNg=="}

            expect(actual).toContain('response: {"code":"Eg","state":"state"');
        });
    });
});
