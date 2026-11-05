import sys, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from election_world_model import backtest, predict, score, forecast, metrics, display_name
import importlib.util
spec=importlib.util.spec_from_file_location('sync_election_world',Path(__file__).resolve().parents[1]/'scripts/sync-election-world.py')
module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
normalize=module.normalize

def election(date,a,country='X',id=None):
    return {'id':id or date,'country':country,'kind':'parliamentary','date':date,'shares':{'a':a,'b':100-a},'labels':{'a':'Party A','b':'Party B'},'source':'https://example.org/result'}

class ModelTests(unittest.TestCase):
    def test_future_outcomes_cannot_change_earlier_prediction(self):
        data=[election('2000-01-01',60),election('2004-01-01',55),election('2008-01-01',48),election('2012-01-01',40)]
        before,_=backtest(data);data[-1]['shares']={'a':99,'b':1};after,_=backtest(data)
        self.assertEqual(before[0],after[0]);self.assertLess(before[0]['inputThrough'],before[0]['date'])
    def test_same_date_targets_are_not_training_inputs_for_each_other(self):
        data=[election(y,a,c) for c in ['X','Y'] for y,a in [('2000-01-01',60),('2004-01-01',55),('2008-01-01',50),('2012-01-01',45)]]
        trials,_=backtest(data)
        for t in trials:
            self.assertTrue(t['trainingThrough'] is None or t['trainingThrough']<t['date'])
        self.assertEqual(trials[0]['trainingTrials'],trials[1]['trainingTrials'])
    def test_baseline_and_error_have_known_answers(self):
        p=predict([election('2000-01-01',60)],0)
        self.assertEqual(p,{'a':60,'b':40});self.assertEqual(score(p,{'a':40,'b':60}),20)
        self.assertEqual(metrics([])['accuracy'],None)
    def test_provider_boundaries_are_not_electoral_swings(self):
        data=[election('2000-01-01',60),election('2004-01-01',55),election('2008-01-01',50)]
        data[-1]['provider']='different-label-system'
        trials,_=backtest(data)
        self.assertEqual(trials,[])
        data.append(election('2012-01-01',45))
        trials,_=backtest(data)
        self.assertEqual(len(trials),1)
        self.assertEqual(trials[0]['inputThrough'],'2004-01-01')
        self.assertEqual(trials[0]['sourceFamily'],'curated')
    def test_german_union_has_combined_display_label(self):
        self.assertEqual(display_name('DEU','union','CSU'),'CDU/CSU')
    def test_model_is_not_person_or_country_fixed(self):
        p=predict([election('2000-01-01',30,'TUR'),election('2004-01-01',20,'TUR')],0)
        self.assertGreater(p['b'],p['a'])
    def test_seat_and_vote_records_are_distinct_families(self):
        e={'scope':'national','iso3':'XYZ','kind':'parliamentary','held_on':'2020-01-01','slug':'x','contestants':[{'party':'A','seats':60},{'party':'B','seats':40}]}
        n=normalize(e);self.assertEqual(n['kind'],'parliamentary-seats');self.assertAlmostEqual(sum(n['shares'].values()),100)
    def test_unknown_fields_and_country_conflicts_fail_closed(self):
        e={'scope':'national','iso3':'SDN','kind':'parliamentary','name':'South Sudan election','held_on':'2020-01-01','slug':'x','contestants':[{'party':'A','vote_share':60},{'party':'B','vote_share':40}]}
        self.assertIsNone(normalize(e));e['iso3']='XYZ';e['indirect']=True;self.assertIsNone(normalize(e))
    def test_scenario_is_separate_from_history(self):
        import json
        root=Path(__file__).resolve().parents[1]/'static/sdcofa/election/feeds'
        world=json.loads((root/'world-model.json').read_text(encoding='utf-8'));history=json.loads((root/'history.json').read_text(encoding='utf-8'));validation=json.loads((root/'validation.json').read_text(encoding='utf-8'))
        t=next(c for c in world['countries'] if c['code']=='TUR');self.assertEqual(t['scenario']['type'],'scenario');self.assertIn('NOT A FORECAST',t['scenario']['label'])
        self.assertFalse(any(r['id']==t['scenario']['id'] for r in history['records']));self.assertFalse(any(r['election']==t['scenario']['id'] for r in validation['trials']))
        self.assertEqual(len(world['countries']),len({c['code'] for c in world['countries']}));self.assertGreaterEqual(len(world['countries']),200)

if __name__=='__main__':unittest.main()
