var assert = require("assert");
var should = require("should");
var Glommer = require('./../ChangeGlommer.js');

console.log("Starting tests.");
//paste should be an atomic
//text inserts in difff positions shoudl be difff
//events from api are not glommed
//Addr + ess\nSt + ate -> address


describe('ChangeGlommer', function() {


    var c = {"timestamp":1346109469573,"user":null,"uuid":"77660c97-1c95-4e9e-89d0-374baece2440","data":{"action":"insertText","range":{"start":{"row":2,"column":0},"end":{"row":2,"column":1}},"text":"c"}};
    var a = {"timestamp":1346109469790,"user":null,"uuid":"c61d1d63-6308-461a-8b55-d0b592a2cab2","data":{"action":"insertText","range":{"start":{"row":2,"column":1},"end":{"row":2,"column":2}},"text":"a"}};
    var t = {"timestamp":1346109470109,"user":null,"uuid":"2bdabf21-0b4e-4b16-8e87-5db58e51149a","data":{"action":"insertText","range":{"start":{"row":2,"column":2},"end":{"row":2,"column":3}},"text":"t"}};
    var BS1 = {"timestamp":1346109469573,"user":null,"uuid":"788f415b-3d6d-47a7-8b9d-ac45bbefc621","data":{"action":"removeText","range":{"start":{"row":1,"column":1},"end":{"row":1,"column":2}},"text":"c"}};
    var BS2 = {"timestamp":1346109469966,"user":null,"uuid":"788f415b-3d6d-47a7-8b9d-ac45bbefc621","data":{"action":"removeText","range":{"start":{"row":1,"column":1},"end":{"row":1,"column":2}},"text":"a"}};
    var BS3 = {"timestamp":1346109470066,"user":null,"uuid":"888fc7ca-0430-49a8-bc2c-993389e05d13","data":{"action":"removeText","range":{"start":{"row":3,"column":0},"end":{"row":3,"column":1}},"text":"x"}};
    var late_a = {"timestamp":1346109470790,"user":null,"uuid":"c61d1d63-6308-461a-8b55-d0b592a2cab2","data":{"action":"insertText","range":{"start":{"row":2,"column":1},"end":{"row":2,"column":2}},"text":"a"}};

    function assertEqualChange(change1, change2) {
        if (change1.uuid != change2.uuid) return false;
        if (change1.user != change2.user) return false;
        if (change1.timestamp != change2.timestamp) return false;
        if (change1.data.text != change2.data.text) return false;
        if (change1.data.range.start.row != change2.data.range.start.row) return false;
        if (change1.data.range.start.column != change2.data.range.start.column) return false;
        if (change1.data.range.end.row != change2.data.range.end.row) return false;
        if (change1.data.range.end.column != change2.data.range.end.column) return false;
        return true;
    }

    describe('Constructor', function() {
        it('should load', function() {
            assert(ChangeGlommer);
            var glommer = new ChangeGlommer();
            assert(glommer);
        });
    });

    describe('Glommer', function() {
        it ('should glom c and a to single change', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                assert(glommer.shift());
                assert( !glommer.shift());
                console.log("Calling done.");
                done();
            }]);
            glommer.push(c);
            glommer.push(a);
        });

        it ('should glom c and a to ca', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change = glommer.shift();
                console.log("Found glommed_change: " + JSON.stringify(change));
                assert.equal(change.data.action, 'insertText');
                assert.equal(change.data.text, 'ca');
                assert.equal(change.data.range.start, c.data.range.start);
                assert.equal(change.data.range.end, a.data.range.end);
                console.log("Calling done.");
                done();
            }]);
            glommer.push(c);
            glommer.push(a);
        });

        it ('should glom c + a + t to cat', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change = glommer.shift();
                assert.equal(change.data.action, 'insertText');
                assert.equal(change.data.text, 'cat');
                assert.equal(change.data.range.start, c.data.range.start);
                assert.equal(change.data.range.end, t.data.range.end);
                done();
            }]);
            glommer.push(c);
            glommer.push(a);
            glommer.push(t);
        });

        it ('should glom c + a + ^h to c', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change = glommer.shift();
                assert.equal(change.data.action, 'insertText');
                assert.equal(change.data.text, 'c');
                assert.equal(change.data.range.start, c.data.range.start);
                assert.equal(change.data.range.end, c.data.range.end);
                assert.not.exists(glommer.shift());
                done();
            }]);
            glommer.push(c);
            glommer.push(a);
            glommer.push(BS2);
        });

        it ('should glom c + ^h to null', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change = glommer.shift();
                console.log("************Null test found change " + JSON.stringify(change));
                should.not.exist(change);
                done();
            }]);
            glommer.push(c);
            glommer.push(BS1);
        });

        it ('should glom ^h + ^h + ^h to ^h^h^h', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change = glommer.shift();
                assert.equal(change.data.action, 'removeText');
                assert.equal(change.data.text, 'cax');
                assert.equal(change.data.range.start, BS3.data.range.start);
                assert.equal(change.data.range.end, BS1.data.range.end);
                done();
            }]);
            glommer.push(BS1);
            glommer.push(BS2);
            glommer.push(BS3);
        });

        it ('should glom c + ^h + ^h to ^h', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change = glommer.shift();
                assert.equal(change.data.action, 'removeText');
                assert.equal(change.data.text, 'a');
                assert.equal(change.data.range.start, BS2.data.range.start);
                assert.equal(change.data.range.end, BS2.data.range.end);
                done();
            }]);
            glommer.push(c);
            glommer.push(BS1);
            glommer.push(BS2);
        });

        it ('should not glom c and a if separated by 1s', function(done) {
            var glommer = new ChangeGlommer(null, [function() {
                var change_1 = glommer.shift();
                console.log("First change: " + JSON.stringify(change_1));
                var change_2 = glommer.shift();
                console.log("Second change: " + JSON.stringify(change_2));
                var change_3 = glommer.shift();
                console.log("Third change: " + JSON.stringify(change_3));
                assertEqualChange(change_1, c);
                assertEqualChange(change_2, a);
                should.not.exist(change_3);
                done();
            }]);
            glommer.push(c);
            console.log("First pushed change: " + JSON.stringify(c));
            glommer.push(late_a);
        });
    });

});

