/**
 * @license Copyright 2013 DesertNet, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict"

var NailgunServer = require("../src/NailgunServer.js")
  , ServerProcessMock = require("./ServerProcessMock.js")
  , assert = require("assert")
  , sinon = require("sinon")
  , path = require("path")
  , EventEmitter = require("events").EventEmitter

var server, addr, port, serverProcMock, spawner
beforeEach(function () {
    addr = "127.0.0.1"
    port = 2113
    server = new NailgunServer(addr, port)
    serverProcMock = new ServerProcessMock()
    sinon.stub(server, "_doSpawn").returns(serverProcMock)
})

describe("NailgunServer", function () {
    describe("prototype._start", function () {
        it("should call the spawn function with args to run the nailgun server", function (done) {
            var jarpath = path.resolve(__dirname + "/../support/nailgun-0.7.1.jar")
            serverProcMock.emulateServerStart()
            server._start(function (err) {
                assert.ifError(err)
                assert.ok(server._doSpawn.calledWith(
                    "java"
                  , ["-jar", jarpath, addr+":"+port]
                  , {"detached": true, "stdio": ["ignore", "pipe", "ignore"]}
                ))
                done()
            })
        })

        it("should call the callback when the server is started", function (done) {
            serverProcMock.emulateServerStart()
            server._start(function (err) {
                done()
            })
        })

        it("should call the callback with an error when startup has failed", function (done) {
            serverProcMock.emulateServerFailedStart()
            server._start(function (err) {
                assert.ok(err)
                done()
            })
        })
    })

    xdescribe("prototype.spawn", function () {
        beforeEach(function () {
            serverProcMock.emulateServerStart()

            var remoteProcMock = new EventEmitter()
            remoteProcMock.stdin = new EventEmitter()
            remoteProcMock.stdout = new EventEmitter()
            remoteProcMock.stderr = new EventEmitter()
            sinon.stub(server, "_spawnProcessFromNailgunConnection").returns(remoteProcMock)
        })

        it("should return something like a ChildProcess", function (done) {
            server.spawn("ng-cp", [], function (err, proc) {
                assert.ifError(err)
                assert.ok(proc)
                assert.ok(proc.stdin)
                assert.ok(proc.stdout)
                assert.ok(proc.stderr)
                assert.ok(proc.on)
                done()
            })
        })

        it("should start a Nailgun server process if not already running", function (done) {
            sinon.stub(server, "_start")
            server.spawn("ng-cp", [], function (err, proc) {
                assert.ifError(err)
                assert.ok(server._start.called)
                done()
            })
        })
    })
})

