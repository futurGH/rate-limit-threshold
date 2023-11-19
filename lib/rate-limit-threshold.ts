import Debug from 'debug';

const debug = Debug('musicbrainz-api:rate-limiter');

export class RateLimitThreshold {

  public static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private queue: number[] = [];
  private readonly period: number;

  /**
   * @param requests Number of allowed requests with period
   * @param period Period in milliseconds
   */
  public constructor(private requests: number, period: number) {
    debug(`Rate limiter initialized with max ${requests} calls in ${period} seconds.`);
    this.period = 1000 * period;
  }

  /**
   * Call limit before the function you want call no more than `requests` in per `period`.
   * @return Resolved when timeout completed comply with rate limit threshold
   */
  public async limit(): Promise<number> {
    const now = new Date().getTime();
    const t0 = now - (this.period);
    while (this.queue.length > 0 && this.queue[0] < t0) {
      this.queue.shift();
    }
    let delay = 0;
    // debug(`Current rate is  ${this.queue.length} per ${this.period / 1000} sec`);
    if (this.queue.length >= this.requests) {
      delay = this.queue[0] + this.period - now;
      debug(`Client side rate limiter activated: cool down for ${delay / 1000} s...`);
      await RateLimitThreshold.sleep(delay);
    }
    this.queue.push(new Date().getTime());
    return delay;
  }

}
