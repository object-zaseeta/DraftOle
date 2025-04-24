import Testing
@testable import DraftOle

struct DraftOleTests {
    @Test func test_first() async throws {
        #expect( 1+1 == 2)
    }
    @Test func test_calc() {
        let cal = Calculator()
        #expect( cal.add(1, 1) == 2 )
    
    }
    @Test func test_export() {
        
    }

}

