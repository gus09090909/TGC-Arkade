
define('app/dashboard/score', 
[
    'app/dashboard/_base', 'app/episodes/_'
], 
function(Base, episode) {

    function DashboardScore(dashboard) {
        var score = episode.getManifest().dashboard.score;
        
        Base.call(this);
        this.entity = new createjs.Text('0', score.font, score.color);
        this.entity.x = score.x;
        this.entity.y = score.y;
        this.entity.textAlign = score.textAlign;
        this.score = 0;
        this.sessionAccumulated = 0;
        this.initialize(dashboard);
    }
    
    DashboardScore.prototype = Object.create(Base.prototype, {
        constructor: {
            value: DashboardScore,
            enumerable: false
        }
    });

    /**
     * @method initialize
     * @param {Dashboard} dashboard
     */
    DashboardScore.prototype.initialize = function(dashboard) {
        Base.prototype.initialize.call(this, dashboard);
    };

    /**
     * @method get
     * @return {Number}
     */
    DashboardScore.prototype.get = function() {
        return (this.sessionAccumulated | 0) + (this.score | 0);
    };

    /**
     * Points earned in the current level only (session total = get() - getLevelScore() + getLevelScore()).
     */
    DashboardScore.prototype.getLevelScore = function() {
        return this.score | 0;
    };

    /**
     * @method set
     * @param {Number} score [optional]
     */
    DashboardScore.prototype.set = function(score) {
        this.score = score;
        this._updateScore();
        this.emit('change', [this.score]);
    };

    /**
     * @method incr
     * @param {Number} by
     */
    DashboardScore.prototype.incr = function(by) {
        this.score += (by || 1);
        this._updateScore();
        this.emit('change', [this.score]);
    };

    /**
     * @method decrease
     * @param {Number} by
     */
    DashboardScore.prototype.decr = function(by) {
        this.score -= (by || 1);
        this._updateScore();
        this.emit('change', [this.score]);
    };

    /**
     * @method reset
     */
    DashboardScore.prototype.reset = function() {
        this.score = 0;
        this._updateScore();
        this.emit('change', [this.get()]);
    };

    /**
     * New run after game over — clears session accumulation and level score.
     */
    DashboardScore.prototype.resetSession = function() {
        this.sessionAccumulated = 0;
        this.score = 0;
        this._updateScore();
        this.emit('change', [this.get()]);
    };

    /**
     * After clearing a level — keep session total, reset level counter.
     */
    DashboardScore.prototype.commitLevelToSession = function() {
        this.sessionAccumulated = (this.sessionAccumulated | 0) + (this.score | 0);
        this.score = 0;
        this._updateScore();
        this.emit('change', [this.get()]);
    };

    /**
     * @method _updateScore
     */
    DashboardScore.prototype._updateScore = function() {
        this.update(String((this.sessionAccumulated | 0) + (this.score | 0)));
    };

    return DashboardScore;
});